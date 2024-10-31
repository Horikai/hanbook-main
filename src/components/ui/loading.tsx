import { Loader2 } from 'lucide-react'

export const LoadingSpinner = ({ className = 'w-8 h-8' }: { className?: string }) => (
	<Loader2 className={`animate-spin text-gray-400 dark:text-gray-500 ${className}`} />
)

export const LoadingContainer = ({ className = 'w-full h-64' }: { className?: string }) => (
	<div className={`flex items-center justify-center ${className}`}>
		<LoadingSpinner />
	</div>
)
