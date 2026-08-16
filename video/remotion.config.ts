import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// H.264 em qualidade alta: é o que Instagram e YouTube aceitam sem recodificar
// de novo por cima. CRF menor = arquivo maior e menos perda.
Config.setCodec("h264");
Config.setCrf(17);
