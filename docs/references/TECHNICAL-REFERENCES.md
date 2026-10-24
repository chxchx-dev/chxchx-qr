# Referencias técnicas

- [`qr` — encoder QR para Node y navegador](https://github.com/paulmillr/qr): paquete usado por `packages/qr-core`; el código QR se genera en el proceso API, sin servicio remoto. Su licencia permite elegir MIT o Apache-2.0.
- [Nayuki QR Code generator](https://github.com/nayuki/QR-Code-generator): opción TypeScript/JavaScript con licencia MIT, considerada como alternativa si se decide incorporar el código del encoder directamente al repositorio.
- [Código TypeScript de Nayuki](https://github.com/nayuki/QR-Code-generator/blob/master/typescript-javascript/qrcodegen.ts).

La elección vigente es mantener `qr`: está encapsulado, genera matrices y varios formatos, y evita importar un segundo encoder. La alternativa de Nayuki no se incorpora en paralelo; una sustitución requiere revisar licencia, capacidad, formatos y paridad con vectores propios.
