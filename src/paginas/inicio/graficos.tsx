import { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'
import type { ParteDashboard, PuntoActividad } from '@/api'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const FUENTE = 'Geist Variable, ui-sans-serif, system-ui, sans-serif'

function etiquetaDia(fecha: string): string {
  const partes = fecha.split('-')
  return `${Number(partes[2])} ${MESES[(Number(partes[1]) || 1) - 1]}`
}

function base(extras: ApexOptions = {}): ApexOptions {
  return {
    chart: {
      fontFamily: FUENTE,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 560, dynamicAnimation: { speed: 280 } },
      ...extras.chart,
    },
    grid: { borderColor: '#f4f4f5', strokeDashArray: 4, padding: { left: 8, right: 8 }, ...extras.grid },
    dataLabels: { enabled: false, ...extras.dataLabels },
    legend: {
      fontSize: '12px',
      fontFamily: FUENTE,
      labels: { colors: '#71717a' },
      markers: { size: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 10 },
      ...extras.legend,
    },
    tooltip: { theme: 'light', style: { fontFamily: FUENTE, fontSize: '12px' }, ...extras.tooltip },
    stroke: extras.stroke,
    fill: extras.fill,
    colors: extras.colors,
    xaxis: extras.xaxis,
    yaxis: extras.yaxis,
    plotOptions: extras.plotOptions,
    labels: extras.labels,
    states: { hover: { filter: { type: 'darken' } } },
  }
}

function Vacio({ texto }: { texto: string }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{texto}</p>
}

export function GraficoActividad({ puntos }: { puntos: PuntoActividad[] }) {
  const categorias = useMemo(() => puntos.map((p) => etiquetaDia(p.fecha)), [puntos])
  const series = useMemo(
    () => [
      { name: 'Recibidos', type: 'column', data: puntos.map((p) => p.recibidos) },
      { name: 'Enviados', type: 'column', data: puntos.map((p) => p.enviados) },
      { name: 'Cerrados', type: 'area', data: puntos.map((p) => p.cerrados) },
    ],
    [puntos],
  )

  const opciones = useMemo<ApexOptions>(
    () =>
      base({
        chart: { type: 'line', stacked: false },
        colors: ['#10b981', '#0ea5e9', '#f59e0b'],
        stroke: { width: [0, 0, 3], curve: 'smooth' },
        fill: { opacity: [1, 1, 0.18], type: ['solid', 'solid', 'gradient'] },
        plotOptions: { bar: { columnWidth: '52%', borderRadius: 5, borderRadiusApplication: 'end' } },
        xaxis: {
          categories: categorias,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { style: { colors: '#a1a1aa', fontSize: '11px' } },
        },
        yaxis: { min: 0, decimalsInFloat: 0, labels: { style: { colors: '#a1a1aa', fontSize: '11px' } } },
        tooltip: { shared: true, intersect: false },
      }),
    [categorias],
  )

  if (puntos.length === 0) return <Vacio texto="Todavía no hay actividad en este periodo." />

  return <Chart type="line" height={320} series={series} options={opciones} />
}

export function EmbudoVisual({ items, vacio }: { items: ParteDashboard[]; vacio: string }) {
  const datos = useMemo(() => items.filter((item) => item.total > 0), [items])
  const opciones = useMemo<ApexOptions>(
    () =>
      base({
        chart: { type: 'bar' },
        colors: datos.map((item) => item.color),
        plotOptions: {
          bar: {
            horizontal: true,
            isFunnel: true,
            borderRadius: 6,
            distributed: true,
          },
        },
        xaxis: { categories: datos.map((item) => item.nombre) },
        legend: { show: false },
        dataLabels: {
          enabled: true,
          formatter: (_valor, opts) => {
            const item = datos[opts?.dataPointIndex ?? 0]
            return item ? `${item.nombre} · ${item.total}` : ''
          },
          style: { fontSize: '12px', fontWeight: 600, colors: ['#fff'] },
          dropShadow: { enabled: false },
        },
        tooltip: {
          y: { formatter: (valor) => String(valor) },
        },
      }),
    [datos],
  )

  if (datos.length === 0) return <Vacio texto={vacio} />

  return <Chart type="bar" height={300} series={[{ name: 'Clientes', data: datos.map((item) => item.total) }]} options={opciones} />
}

export function Dona({ items, vacio, etiquetaCentro }: { items: ParteDashboard[]; vacio: string; etiquetaCentro: string }) {
  const datos = useMemo(() => items.filter((item) => item.total > 0), [items])
  const total = datos.reduce((suma, item) => suma + item.total, 0)
  const opciones = useMemo<ApexOptions>(
    () =>
      base({
        chart: { type: 'donut' },
        labels: datos.map((item) => item.nombre),
        colors: datos.map((item) => item.color),
        stroke: { width: 2, colors: ['#fff'] },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                name: { fontSize: '12px', color: '#71717a', offsetY: 14 },
                value: { fontSize: '22px', fontWeight: 650, color: '#18181b', offsetY: -8 },
                total: {
                  show: true,
                  label: etiquetaCentro,
                  fontSize: '12px',
                  color: '#71717a',
                  formatter: () => String(total),
                },
              },
            },
          },
        },
        legend: { position: 'bottom' },
      }),
    [datos, etiquetaCentro, total],
  )

  if (datos.length === 0) return <Vacio texto={vacio} />

  return <Chart type="donut" height={300} series={datos.map((item) => item.total)} options={opciones} />
}

export function AnilloResultado({ ganados, perdidos }: { ganados: number; perdidos: number }) {
  const total = ganados + perdidos
  const porcentaje = total === 0 ? 0 : Math.round((ganados / total) * 100)
  const opciones = useMemo<ApexOptions>(
    () =>
      base({
        chart: { type: 'radialBar' },
        colors: ['#10b981'],
        plotOptions: {
          radialBar: {
            hollow: { size: '64%' },
            track: { background: '#ffe4e6', strokeWidth: '100%' },
            dataLabels: {
              name: { fontSize: '12px', color: '#71717a', offsetY: 18 },
              value: { fontSize: '26px', fontWeight: 650, color: '#18181b', offsetY: -12, formatter: () => `${porcentaje}%` },
            },
          },
        },
        labels: ['Ganados'],
        legend: { show: false },
      }),
    [porcentaje],
  )

  if (total === 0) {
    return <Vacio texto="Aún no hay ventas ganadas ni perdidas en este periodo." />
  }

  return (
    <div>
      <Chart type="radialBar" height={280} series={[porcentaje]} options={opciones} />
      <div className="mt-1 flex justify-center gap-6 text-sm">
        <p>
          <span className="text-muted-foreground">Ganados </span>
          <span className="font-semibold tabular-nums text-emerald-600">{ganados}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Perdidos </span>
          <span className="font-semibold tabular-nums text-rose-500">{perdidos}</span>
        </p>
      </div>
    </div>
  )
}

export function MiniSpark({ valores, color = '#10b981' }: { valores: number[]; color?: string }) {
  const opciones = useMemo<ApexOptions>(
    () => ({
      chart: { sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 2, colors: [color] },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.7, opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 100] }, colors: [color] },
      tooltip: { enabled: false },
      colors: [color],
    }),
    [color],
  )

  if (valores.length < 2) return null

  return (
    <div className="mt-2">
      <Chart type="area" height={28} series={[{ data: valores }]} options={opciones} />
    </div>
  )
}
