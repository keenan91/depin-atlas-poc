'use client'
import {SimulationResponse} from '@/lib/types'

interface ResultsDisplayProps {
  error: string | null
  simulationData: SimulationResponse | null
}

export default function ResultsDisplay({
  error,
  simulationData,
}: ResultsDisplayProps) {
  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    )
  }

  if (simulationData) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">Simulation Results</h2>
        <pre className="text-sm bg-gray-900 p-4 rounded-md overflow-x-auto">
          {JSON.stringify(simulationData, null, 2)}
        </pre>
      </div>
    )
  }

  return null
}
