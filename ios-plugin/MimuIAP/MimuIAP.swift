import Foundation
import StoreKit
import Capacitor

/**
 A ponte entre a tela da Mimu e o In-App Purchase da Apple.

 A Mimu roda numa WKWebView, e WebView não enxerga o StoreKit: comprar pela
 Apple é código nativo. Este plugin é o lado de cá do contrato descrito em
 `lib/iap.ts` — os quatro métodos ali são exatamente os quatro daqui.

 USA STOREKIT 2 (`Product`, `Transaction`), e não o StoreKit 1 de `SKPayment`.
 A diferença que importa: o StoreKit 2 entrega a transação já verificada pela
 Apple e com `async/await`, enquanto o 1 exige uma máquina de observadores que
 é a origem clássica de compra perdida — o app fecha no meio e a transação
 fica pendurada.

 O QUE ESTE ARQUIVO NÃO FAZ: liberar acesso. Ele devolve o `transactionId` para
 a tela, que manda ao servidor, que pergunta à Apple. Está escrito assim de
 propósito — o comentário de `lib/iap.ts` explica: acreditar no que volta do
 aparelho é o mesmo buraco de aceitar o preço vindo do navegador.
 */
@objc(MimuIAP)
public class MimuIAP: CAPPlugin {

    /// Requer iOS 15. O `Package.swift`/podspec declara isso; aqui é a rede.
    private var storeKitDisponivel: Bool {
        if #available(iOS 15.0, *) { return true }
        return false
    }

    /**
     Abre a folha de pagamento da Apple.

     O preço NÃO vem do JavaScript. Quem define é o App Store Connect, por
     produto — mandar valor daqui seria a mesma falha que o checkout próprio já
     evita.
     */
    @objc func comprar(_ call: CAPPluginCall) {
        guard let produtoId = call.getString("produtoId"), !produtoId.isEmpty else {
            call.resolve(["ok": false, "erro": "produto_ausente"])
            return
        }

        guard storeKitDisponivel else {
            call.resolve(["ok": false, "erro": "ios_antigo"])
            return
        }

        if #available(iOS 15.0, *) {
            Task {
                do {
                    guard let produto = try await Product.products(for: [produtoId]).first else {
                        // Produto que não existe no App Store Connect, ou ainda
                        // não aprovado. Não é erro da pessoa.
                        call.resolve(["ok": false, "erro": "produto_desconhecido"])
                        return
                    }

                    let resultado = try await produto.purchase()

                    switch resultado {
                    case .success(let verificacao):
                        switch verificacao {
                        case .verified(let transacao):
                            /*
                             `finish()` é OBRIGATÓRIO e não é detalhe.

                             Sem ele a Apple considera a compra não entregue e
                             a reapresenta a cada abertura do app — a pessoa vê
                             a folha de pagamento surgir sozinha, para sempre.
                             */
                            await transacao.finish()
                            call.resolve([
                                "ok": true,
                                "transactionId": String(transacao.id)
                            ])
                        case .unverified(_, let erro):
                            // A Apple não conseguiu provar a própria compra.
                            call.resolve(["ok": false, "erro": "nao_verificada: \(erro)"])
                        }

                    case .userCancelled:
                        // Desistir é normal, e a tela trata como "nada
                        // aconteceu" — não como falha.
                        call.resolve(["ok": false, "erro": "cancelada"])

                    case .pending:
                        /*
                         "Pedir para comprar" (controle parental) e pagamentos
                         que exigem confirmação bancária caem aqui. A compra
                         pode ser aprovada minutos ou horas depois.
                         */
                        call.resolve(["ok": false, "erro": "pendente"])

                    @unknown default:
                        call.resolve(["ok": false, "erro": "desconhecido"])
                    }
                } catch {
                    call.resolve(["ok": false, "erro": "falhou: \(error)"])
                }
            }
        }
    }

    /**
     O preço como a Apple escreve.

     Existe porque a Apple vende por FAIXAS de preço, e a faixa mais próxima de
     R$ 39,90 pode não ser R$ 39,90. Mostrar o número da nossa tabela e a Apple
     cobrar outro é anunciar um preço e cobrar outro — quebra de confiança, e
     reprovação na revisão.

     Vem formatado dela, e não como número: ela conhece a moeda e o formato da
     região de quem está olhando; nós não.
     */
    @objc func precoFormatado(_ call: CAPPluginCall) {
        guard let produtoId = call.getString("produtoId"), storeKitDisponivel else {
            call.resolve(["preco": NSNull()])
            return
        }

        if #available(iOS 15.0, *) {
            Task {
                let produto = try? await Product.products(for: [produtoId]).first
                call.resolve(["preco": produto?.displayPrice ?? NSNull()])
            }
        }
    }

    /**
     Recupera uma assinatura que a Apple já conhece.

     A diretriz 3.1.1 exige este caminho para qualquer assinatura: sem ele,
     quem trocou de aparelho ou reinstalou perde o que pagou, e a revisão
     reprova o envio.

     Devolve a transação ATIVA mais recente. Quem decide se ela vale é o
     servidor, conferindo com a App Store Server API.
     */
    @objc func restaurar(_ call: CAPPluginCall) {
        guard storeKitDisponivel else {
            call.resolve(["ok": false, "erro": "ios_antigo"])
            return
        }

        if #available(iOS 15.0, *) {
            Task {
                /*
                 `AppStore.sync()` NÃO é chamado aqui de propósito.

                 Ele força uma autenticação com a Apple e a Apple recomenda usar
                 só quando a pessoa pede explicitamente. `currentEntitlements` já
                 devolve o que este Apple ID possui, sem pedir senha — e é o
                 caminho que a revisão espera de um botão "Restaurar".
                 */
                for await resultado in Transaction.currentEntitlements {
                    if case .verified(let transacao) = resultado {
                        if transacao.revocationDate == nil {
                            call.resolve([
                                "ok": true,
                                "transactionId": String(transacao.id)
                            ])
                            return
                        }
                    }
                }
                call.resolve(["ok": false, "erro": "nada_a_restaurar"])
            }
        }
    }

    /**
     Leva a Ajustes → Assinaturas.

     É o único lugar onde uma assinatura comprada por IAP pode ser cancelada:
     nem o app nem o nosso servidor têm essa permissão, nem por API.
     */
    @objc func abrirGerenciamento(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: "https://apps.apple.com/account/subscriptions") else {
                call.resolve()
                return
            }
            UIApplication.shared.open(url)
            call.resolve()
        }
    }
}
