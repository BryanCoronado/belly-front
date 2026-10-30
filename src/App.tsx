import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutApp } from '@/components/layout/LayoutApp'
import { RequiereWhatsapp } from '@/components/RequiereWhatsapp'
import { AgenteIa } from '@/paginas/AgenteIa'
import { Asesores } from '@/paginas/Asesores'
import { Inicio } from '@/paginas/Inicio'
import { Login } from '@/paginas/Login'
import { Equipo } from '@/paginas/Equipo'
import { Productos } from '@/paginas/Productos'
import { Chats } from '@/paginas/chat/Chats'
import { Supervision } from '@/paginas/chat/Supervision'
import { ConexionWhatsapp } from '@/paginas/integraciones/ConexionWhatsapp'
import { CostosWhatsapp } from '@/paginas/integraciones/CostosWhatsapp'
import { Integraciones } from '@/paginas/integraciones/Integraciones'
import { ListaNegra } from '@/paginas/Modulos'
import { Plantillas } from '@/paginas/plantillas/PlantillasRapidas'
import { EditorFlujo } from '@/paginas/automatizacion/EditorFlujo'
import { Flujos } from '@/paginas/automatizacion/Flujos'
import { Clientes } from '@/paginas/clientes/Clientes'
import { ImportarClientes } from '@/paginas/clientes/ImportarClientes'
import { DetalleEnvio } from '@/paginas/envios/DetalleEnvio'
import { Envios } from '@/paginas/envios/Envios'
import { NuevoEnvio } from '@/paginas/envios/NuevoEnvio'
import { Perfil } from '@/paginas/Perfil'
import { Registro } from '@/paginas/Registro'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route element={<LayoutApp />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/dashboard" element={<Inicio />} />
          <Route element={<RequiereWhatsapp />}>
            <Route path="/chats" element={<Chats />} />
            <Route path="/supervision" element={<Supervision />} />
            <Route path="/conversaciones/chat/mis_clientes" element={<Clientes propios />} />
            <Route path="/conversaciones/chat/mis_plantillas" element={<Plantillas />} />
            <Route path="/plantillas" element={<Plantillas />} />
            <Route path="/asesores" element={<Asesores />} />
            <Route path="/automatizacion" element={<Flujos />} />
            <Route path="/automatizacion/:id" element={<EditorFlujo />} />
            <Route path="/envios" element={<Envios />} />
            <Route path="/envios/nuevo" element={<NuevoEnvio />} />
            <Route path="/envios/:id" element={<DetalleEnvio />} />
          </Route>
          <Route path="/conversaciones/chat" element={<Navigate to="/chats" replace />} />
          <Route path="/conversaciones/chat/mis_conversaciones" element={<Navigate to="/chats" replace />} />
          <Route path="/conversaciones/configuracion" element={<Navigate to="/integraciones/whatsapp" replace />} />
          <Route path="/whatsapp" element={<Navigate to="/integraciones/whatsapp" replace />} />
          <Route path="/integraciones" element={<Integraciones />} />
          <Route path="/integraciones/whatsapp" element={<ConexionWhatsapp />} />
          <Route path="/integraciones/costos" element={<CostosWhatsapp />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/importar" element={<ImportarClientes />} />
          <Route path="/leads" element={<Navigate to="/clientes" replace />} />
          <Route path="/leads/clientes" element={<Navigate to="/clientes" replace />} />
          <Route path="/leads/lista-negra" element={<Navigate to="/lista-negra" replace />} />
          <Route path="/lista-negra" element={<ListaNegra />} />
          <Route path="/equipo" element={<Equipo />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/agente-ia" element={<AgenteIa />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
