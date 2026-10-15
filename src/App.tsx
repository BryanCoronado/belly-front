import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutApp } from '@/components/layout/LayoutApp'
import { RequiereWhatsapp } from '@/components/RequiereWhatsapp'
import { Inicio } from '@/paginas/Inicio'
import { Login } from '@/paginas/Login'
import { Equipo } from '@/paginas/Equipo'
import {
  Asesores,
  AsesoresCustomer,
  AsesoresVenta,
  Conversaciones,
  ConversacionesAsesores,
  ConversacionesCustomer,
  Leads,
  Marketing,
  MarketingImagenes,
  MarketingPlantillas,
  MarketingVideos,
  Metricas,
  MetricasAsesores,
  MetricasCustomer,
  MetricasMarketing,
  MetricasOrigenes,
  MisClientes,
  Productos,
  Ventas,
} from '@/paginas/ModuloEnConstruccion'
import { Chats } from '@/paginas/chat/Chats'
import { ConexionWhatsapp } from '@/paginas/integraciones/ConexionWhatsapp'
import { Integraciones } from '@/paginas/integraciones/Integraciones'
import { Clientes, ListaNegra, Plantillas } from '@/paginas/Modulos'
import { EditorFlujo } from '@/paginas/automatizacion/EditorFlujo'
import { Flujos } from '@/paginas/automatizacion/Flujos'
import { Registro } from '@/paginas/Registro'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route element={<LayoutApp />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/dashboard" element={<Inicio />} />
          <Route element={<RequiereWhatsapp />}>
            <Route path="/chats" element={<Chats />} />
            <Route path="/conversaciones" element={<Conversaciones />} />
            <Route path="/conversaciones/chat/mis_clientes" element={<MisClientes />} />
            <Route path="/conversaciones/chat/mis_plantillas" element={<Plantillas />} />
            <Route path="/conversaciones/contact_center" element={<ConversacionesAsesores />} />
            <Route path="/conversaciones/customer_success" element={<ConversacionesCustomer />} />
            <Route path="/plantillas" element={<Plantillas />} />
            <Route path="/asesores" element={<Asesores />} />
            <Route path="/asesores/contact_center" element={<AsesoresVenta />} />
            <Route path="/asesores/customer_success" element={<AsesoresCustomer />} />
            <Route path="/metricas" element={<Metricas />} />
            <Route path="/metricas/contact_center" element={<MetricasAsesores />} />
            <Route path="/metricas/customer_success" element={<MetricasCustomer />} />
            <Route path="/metricas/marketing" element={<MetricasMarketing />} />
            <Route path="/metricas/origenes" element={<MetricasOrigenes />} />
            <Route path="/marketing/plantilla" element={<MarketingPlantillas />} />
            <Route path="/automatizacion" element={<Flujos />} />
            <Route path="/automatizacion/:id" element={<EditorFlujo />} />
          </Route>
          <Route path="/conversaciones/chat" element={<Navigate to="/chats" replace />} />
          <Route path="/conversaciones/chat/mis_conversaciones" element={<Navigate to="/chats" replace />} />
          <Route path="/conversaciones/configuracion" element={<Navigate to="/integraciones/whatsapp" replace />} />
          <Route path="/whatsapp" element={<Navigate to="/integraciones/whatsapp" replace />} />
          <Route path="/integraciones" element={<Integraciones />} />
          <Route path="/integraciones/whatsapp" element={<ConexionWhatsapp />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/clientes" element={<Clientes />} />
          <Route path="/leads/lista-negra" element={<ListaNegra />} />
          <Route path="/lista-negra" element={<ListaNegra />} />
          <Route path="/equipo" element={<Equipo />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/marketing/image" element={<MarketingImagenes />} />
          <Route path="/marketing/video" element={<MarketingVideos />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
