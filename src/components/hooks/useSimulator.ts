'use client'

import {useState} from 'react'
import {SimulationResponse} from '@/lib/types'

export function useSimulator() {
  // State variables to hold the user's input
  const [latitude, setLatitude] = useState('40.7128')
  const [longitude, setLongitude] = useState('-74.0060')

  // State variables to manage the application's status
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [simulationData, setSimulationData] =
    useState<SimulationResponse | null>(null)

  /**
   * This function handles the API call.
   */
  const handleSimulation = async () => {
    setIsLoading(true)
    setError(null)
    setSimulationData(null)

    try {
      const response = await fetch(
        `/api/simulate?lat=${latitude}&lon=${longitude}`,
      )
      if (!response.ok) {
        throw new Error(
          'Failed to fetch simulation data. Please check coordinates.',
        )
      }
      const data: SimulationResponse = await response.json()
      setSimulationData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isLoading,
    error,
    simulationData,
    handleSimulation,
  }
}
