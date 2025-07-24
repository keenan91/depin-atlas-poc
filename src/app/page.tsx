'use client'

import {useSimulator} from '@/components/hooks/useSimulator'
import SimulatorForm from '@/components/SimulatorForm'
import ResultsDisplay from '@/components/ResultsDisplay'

export default function HomePage() {
  const {
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isLoading,
    error,
    simulationData,
    handleSimulation,
  } = useSimulator()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">DePIN Atlas</h1>
          <p className="mt-2 text-gray-400">PoC: Earnings Simulator</p>
        </div>

        <SimulatorForm
          latitude={latitude}
          setLatitude={setLatitude}
          longitude={longitude}
          setLongitude={setLongitude}
          isLoading={isLoading}
          handleSimulation={handleSimulation}
        />

        <ResultsDisplay error={error} simulationData={simulationData} />
      </div>
    </main>
  )
}
