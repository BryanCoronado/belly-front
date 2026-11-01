import { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'
import type { ParteDashboard, PuntoActividad } from '@/api'
import { useTema } from '@/lib/tema'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const FUENTE = 'Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif'

function etiquetaDia(fecha: string): string {
  const partes = fecha.split('-')
  return `${Number(partes[2])} ${MESES[(Number(partes[1]) || 1) - 1]}`
}

function paleta(oscuro: boolean) {
  return {
    eje: oscuro ? '#a8aec8' : '#7a7594',
    leyenda: oscuro ? '#c4b5fd' : '#6b6588',
    grilla: oscuro ? 'rgba(167,139,250,0.1)' : '#ebe6f7',
    valor: oscuro ? '#eef0ff' : '#1a1530',
    anillo: oscuro ? '#15182a' : '#fbfaff',
    pista: oscuro ? 'rgba(167,139,250,0.12)' : '#ece6fb',
    tooltip: (oscuro ? 'dark' : 'light') as 'dark' | 'light',
  }
}

function base(oscuro: boolean, extras: ApexOptions = {}): ApexOptions {
  const color = paleta(oscuro)
  return {
    chart: {
      fontFamily: FUENTE,
      background: 'transparent',
      foreColor: color.leyenda,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 560, dynamicAnimation: { speed: 280 } },
      ...extras.chart,
    },
    grid: { borderColor: color.grilla, strokeDashArray: 4, padding: { left: 8, right: 8 }, ...extras.grid },
    dataLabels: { enabled: false, ...extras.dataLabels },
    legend: {
      fontSize: '12px',
      fontFamily: FUENTE,
      labels: { colors: color.leyenda },
      markers: { size: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 10 },
      ...extras.legend,
    },
    tooltip: { theme: color.tooltip, style: { fontFamily: FUENTE, fontSize: '12px' }, ...extras.tooltip },
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
  const { oscuro } = useTema()
  const color = paleta(oscuro)
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
      base(oscuro, {
        chart: { type: 'line', stacked: false },
        colors: ['#5B46B4', '#A78BFA', '#0B1026'],
        stroke: { width: [0, 0, 3], curve: 'smooth' },
        fill: { opacity: [1, 1, 0.18], type: ['solid', 'solid', 'gradient'] },
        plotOptions: { bar: { columnWidth: '52%', borderRadius: 5, borderRadiusApplication: 'end' } },
        xaxis: {
          categories: categorias,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { style: { colors: color.eje, fontSize: '11px' } },
        },
        yaxis: { min: 0, decimalsInFloat: 0, labels: { style: { colors: color.eje, fontSize: '11px' } } },
        tooltip: { shared: true, intersect: false },
      }),
    [categorias, oscuro, color.eje],
  )

  if (puntos.length === 0) return <Vacio texto="Todavía no hay actividad en este periodo." />

  return <Chart key={oscuro ? 'act-oscuro' : 'act-claro'} type="line" height={320} series={series} options={opciones} />
}

export function EmbudoVisual({ items, vacio }: { items: ParteDashboard[]; vacio: string }) {
  const { oscuro } = useTema()
  const datos = useMemo(() => items.filter((item) => item.total > 0), [items])
  const opciones = useMemo<ApexOptions>(
    () =>
      base(oscuro, {
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
    [datos, oscuro],
  )

  if (datos.length === 0) return <Vacio texto={vacio} />

  return <Chart key={oscuro ? 'emb-oscuro' : 'emb-claro'} type="bar" height={300} series={[{ name: 'Clientes', data: datos.map((item) => item.total) }]} options={opciones} />
}

export function Dona({ items, vacio, etiquetaCentro }: { items: ParteDashboard[]; vacio: string; etiquetaCentro: string }) {
  const { oscuro } = useTema()
  const color = paleta(oscuro)
  const datos = useMemo(() => items.filter((item) => item.total > 0), [items])
  const total = datos.reduce((suma, item) => suma + item.total, 0)
  const opciones = useMemo<ApexOptions>(
    () =>
      base(oscuro, {
        chart: { type: 'donut' },
        labels: datos.map((item) => item.nombre),
        colors: datos.map((item) => item.color),
        stroke: { width: 2, colors: [color.anillo] },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                name: { fontSize: '12px', color: color.leyenda, offsetY: 14 },
                value: { fontSize: '22px', fontWeight: 650, color: color.valor, offsetY: -8 },
                total: {
                  show: true,
                  label: etiquetaCentro,
                  fontSize: '12px',
                  color: color.leyenda,
                  formatter: () => String(total),
                },
              },
            },
          },
        },
        legend: { position: 'bottom' },
      }),
    [datos, etiquetaCentro, total, oscuro, color],
  )

  if (datos.length === 0) return <Vacio texto={vacio} />

  return <Chart key={oscuro ? 'dona-oscuro' : 'dona-claro'} type="donut" height={300} series={datos.map((item) => item.total)} options={opciones} />
}

export function AnilloResultado({ ganados, perdidos }: { ganados: number; perdidos: number }) {
  const { oscuro } = useTema()
  const color = paleta(oscuro)
  const total = ganados + perdidos
  const porcentaje = total === 0 ? 0 : Math.round((ganados / total) * 100)
  const opciones = useMemo<ApexOptions>(
    () =>
      base(oscuro, {
        chart: { type: 'radialBar' },
        colors: ['#7C6CF5'],
        plotOptions: {
          radialBar: {
            hollow: { size: '64%' },
            track: { background: color.pista, strokeWidth: '100%' },
            dataLabels: {
              name: { fontSize: '12px', color: color.leyenda, offsetY: 18 },
              value: { fontSize: '26px', fontWeight: 650, color: color.valor, offsetY: -12, formatter: () => `${porcentaje}%` },
            },
          },
        },
        labels: ['Ganados'],
        legend: { show: false },
      }),
    [porcentaje, oscuro, color],
  )

  if (total === 0) {
    return <Vacio texto="Aún no hay ventas ganadas ni perdidas en este periodo." />
  }

  return (
    <div>
      <Chart key={oscuro ? 'anillo-oscuro' : 'anillo-claro'} type="radialBar" height={280} series={[porcentaje]} options={opciones} />
      <div className="mt-1 flex justify-center gap-6 text-sm">
        <p>
          <span className="text-muted-foreground">Ganados </span>
          <span className="font-semibold tabular-nums text-primary">{ganados}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Perdidos </span>
          <span className="font-semibold tabular-nums text-rose-500">{perdidos}</span>
        </p>
      </div>
    </div>
  )
}

export function MiniSpark({ valores, color = '#7C6CF5' }: { valores: number[]; color?: string }) {
  const opciones = useMemo<ApexOptions>(
    () => ({
      chart: { sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false } },
      stroke: { curve: 'straight', width: 1.5, colors: [color] },
      fill: { opacity: 0 },
      tooltip: { enabled: false },
      colors: [color],
    }),
    [color],
  )

  if (valores.length < 2) return null

  return (
    <div className="-mx-1">
      <Chart type="area" height={36} series={[{ data: valores }]} options={opciones} />
    </div>
  )
}
