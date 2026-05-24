# Frontend - GPS Vehicle Tracking System

Dashboard web construido con React + Vite para monitoreo de flota en tiempo real, mapas interactivos y envío de comandos remotos a vehículos.

---

## Tecnologías

| Tecnología   | Versión | Propósito    |
| ------------ | ------- | ------------ |
| React        | 18.3.1  | Framework UI |
| Vite         | 5.4.2   | Build tool   |
| React Router | 6.26.2  | Routing      |
| Axios        | 1.7.7   | HTTP client  |
| MapLibre GL  | 4.7.1   | Mapas        |
| TailwindCSS  | 3.4.1   | Estilos      |
| Lucide React | 0.441.0 | Iconos       |

---

## Instalación

```bash
npm install
```

---

## Variables de Entorno

Crear archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:3000/api
VITE_AWS_REGION=us-east-1
VITE_MAP_NAME=FleetTrackerMap
VITE_IDENTITY_POOL_ID=us-east-1:your-identity-pool-id
```

---

## Estructura del Código

```
frontend/
├── src/
│   ├── components/
│   │   ├── CommandPanel.jsx
│   │   ├── Map.jsx
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── ...
│   ├── services/
│   │   ├── api.js
│   │   └── commandsService.js
│   └── utils/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Configuración de Tailwind

`tailwind.config.js`:

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

`src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Servicios API

`src/services/api.js` — cliente Axios con interceptor para JWT:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

`src/services/commandsService.js`:

```javascript
import api from "./api";

export const sendCommand = async (gpsId, command, parameters = {}) => {
  const response = await api.post(`/commands/${gpsId}/send`, {
    command,
    parameters,
  });
  return response.data;
};

export const getCommandHistory = async (gpsId, limit = 50) => {
  const response = await api.get(`/commands/${gpsId}/history`, {
    params: { limit },
  });
  return response.data;
};
```

---

## Componentes Clave

### CommandPanel

Envía comandos remotos al vehículo desde el dashboard:

```javascript
import React, { useState } from "react";
import { sendCommand } from "../services/commandsService";
import { Lock, Unlock, Bell, BellOff, Lightbulb, Info } from "lucide-react";

const COMMANDS = [
  { id: "block_engine", name: "Bloquear Motor", icon: Lock, variant: "danger" },
  {
    id: "unblock_engine",
    name: "Desbloquear Motor",
    icon: Unlock,
    variant: "success",
  },
  {
    id: "activate_alarm",
    name: "Activar Alarma",
    icon: Bell,
    variant: "warning",
  },
  {
    id: "deactivate_alarm",
    name: "Desactivar Alarma",
    icon: BellOff,
    variant: "secondary",
  },
  {
    id: "flash_lights",
    name: "Flash de Luces",
    icon: Lightbulb,
    variant: "primary",
  },
  {
    id: "request_status",
    name: "Solicitar Estado",
    icon: Info,
    variant: "info",
  },
];

export default function CommandPanel({ gpsId }) {
  const [loading, setLoading] = useState(null);

  const handleCommand = async (command) => {
    if (!confirm(`¿Estás seguro de ejecutar: ${command.name}?`)) return;
    setLoading(command.id);
    try {
      await sendCommand(gpsId, command.id);
      alert("Comando enviado correctamente");
    } catch (error) {
      alert("Error al enviar comando: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {COMMANDS.map((command) => {
        const Icon = command.icon;
        return (
          <button
            key={command.id}
            onClick={() => handleCommand(command)}
            disabled={loading === command.id}
            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all hover:scale-105
              ${loading === command.id ? "opacity-50 cursor-wait" : ""}
              ${command.variant === "danger" ? "border-red-500 hover:bg-red-50" : ""}
              ${command.variant === "success" ? "border-green-500 hover:bg-green-50" : ""}
              ${command.variant === "warning" ? "border-yellow-500 hover:bg-yellow-50" : ""}
              ${command.variant === "primary" ? "border-blue-500 hover:bg-blue-50" : ""}
              ${command.variant === "info" ? "border-gray-500 hover:bg-gray-50" : ""}`}
          >
            <Icon className="w-8 h-8" />
            <span className="text-sm font-medium text-center">
              {command.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

---

## Ejecutar

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## Despliegue en S3 + CloudFront

```bash
# Generar build
npm run build

# Crear bucket S3
aws s3 mb s3://fleet-tracker-frontend
aws s3 website s3://fleet-tracker-frontend --index-document index.html

# Subir archivos
aws s3 sync dist/ s3://fleet-tracker-frontend --delete
```

Para HTTPS y mejor rendimiento, crear una distribución CloudFront apuntando al bucket S3.
