#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

/*
 * O Capacitor descobre os métodos por este arquivo, e não pelo Swift.
 *
 * Sem ele o plugin COMPILA e some em tempo de execução: `window.MimuIAP` fica
 * undefined e a tela conclui, corretamente, que não há caminho de compra. É a
 * falha mais silenciosa de um plugin de Capacitor, e a mais comum.
 */
CAP_PLUGIN(MimuIAP, "MimuIAP",
  CAP_PLUGIN_METHOD(comprar, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(precoFormatado, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(restaurar, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(abrirGerenciamento, CAPPluginReturnPromise);
)
