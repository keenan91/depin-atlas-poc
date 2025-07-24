'use client'

interface SimulatorFormProps {
  latitude: string
  setLatitude: (value: string) => void
  longitude: string
  setLongitude: (value: string) => void
  isLoading: boolean
  handleSimulation: () => void
}

export default function SimulatorForm({
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  isLoading,
  handleSimulation,
}: SimulatorFormProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4 border border-gray-700">
      <div>
        <label
          htmlFor="latitude"
          className="block text-sm font-medium text-gray-300"
        >
          Latitude
        </label>
        <input
          id="latitude"
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
          placeholder="e.g., 40.7128"
        />
      </div>
      <div>
        <label
          htmlFor="longitude"
          className="block text-sm font-medium text-gray-300"
        >
          Longitude
        </label>
        <input
          id="longitude"
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
          placeholder="e.g., -74.0060"
        />
      </div>
      <button
        onClick={handleSimulation}
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Simulating...' : 'Simulate Earnings'}
      </button>
    </div>
  )
}
