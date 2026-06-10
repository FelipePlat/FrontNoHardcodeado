# Velity Backend

API backend de **Velity**, plataforma de salud digital. Este repositorio contiene la base del servidor HTTP preparada para escalar el desarrollo de forma modular.

## Requisitos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) (incluido con Node.js)

## Instalación

1. Clona el repositorio y entra en la carpeta del backend:

   ```bash
   cd backend
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia las variables de entorno y ajústalas si es necesario:

   ```bash
   cp .env.example .env
   ```

   En Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env
   ```

   El archivo `.env` debe definir al menos `PORT` y `NODE_ENV`.

## Comandos disponibles

| Comando        | Descripción                                      |
| -------------- | ------------------------------------------------ |
| `npm start`    | Inicia el servidor en modo producción            |
| `npm run dev`  | Inicia el servidor con recarga automática (nodemon) |
| `npm run lint` | Ejecuta ESLint sobre el proyecto                 |
| `npm run lint:fix` | Ejecuta ESLint y corrige problemas automáticos |

## Verificación rápida

Con el servidor en ejecución (`npm run dev`), abre en el navegador o con curl:

```
http://localhost:3000
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Velity API running"
}
```

## Estructura de carpetas

```
backend/
├── src/
│   ├── config/          # Configuración (variables de entorno, etc.)
│   ├── controllers/     # Controladores de rutas
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio (capa de servicios)
│   ├── middlewares/     # Middlewares de Express
│   ├── utils/           # Utilidades compartidas
│   ├── constants/       # Constantes de la aplicación
│   ├── validators/      # Validación de entradas
│   ├── app.js           # Configuración de Express
│   └── server.js        # Punto de entrada del servidor
├── .env                 # Variables de entorno (no versionar)
├── .env.example         # Plantilla de variables de entorno
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── package.json
└── README.md
```

## Licencia

ISC
