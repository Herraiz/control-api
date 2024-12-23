- Clonar el repositorio
- Solicitar y copiar el archivo .local.env dentro del repositorio
- Pedir las keys de cifrado para JWT
- Ejecutar dentro del repositorio `docker-compose up -d` para levantar la base de datos en un contenedor docker
- Ejecutar la aplicación con `npm run dev`
- Una vez ejecutada se puede consultar la api desde `https://studio.apollographql.com/sandbox/explorer` usando el endpoint `http://localhost:3000/api/graphql`
- También se puede ejecutar el prisma studio para consultar el panel de administración con `npx prisma studio`

WIP: Pueden faltar pasos como generar el esquema y hacer las migraciones, cuando se realice un fresh install se comprobará y actualizará
