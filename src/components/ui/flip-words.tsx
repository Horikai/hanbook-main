'use client'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const FlipWords = ({
	words,
	duration = 3000,
	className,
	classNameWords,
	animateExit = true,
}: {
	words: string[]
	duration?: number
	className?: string
	classNameWords?: string
	animateExit?: boolean
}) => {
	const [currentWord, setCurrentWord] = useState(words[0])
	const [isAnimating, setIsAnimating] = useState<boolean>(false)

	// thanks for the fix Julian - https://github.com/Julian-AT
	const startAnimation = useCallback(() => {
		const word = words[words.indexOf(currentWord) + 1] || words[0]
		setCurrentWord(word)
		setIsAnimating(true)
	}, [currentWord, words])

	useEffect(() => {
		if (!isAnimating)
			setTimeout(() => {
				startAnimation()
			}, duration)
	}, [isAnimating, duration, startAnimation])

	return (
		<AnimatePresence
			onExitComplete={() => {
				setIsAnimating(false)
			}}
		>
			<motion.div
				initial={{
					opacity: 0,
					y: 10,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				transition={{
					type: 'spring',
					stiffness: 100,
					damping: 10,
				}}
				exit={
					animateExit
						? {
								opacity: 0,
								y: -20,
								x: 20,
								filter: 'blur(8px)',
								scale: 1.5,
								position: 'absolute',
							}
						: {}
				}
				className={cn(
					'z-10 inline-block relative text-left text-neutral-900 dark:text-neutral-100 px-2',
					'text-base sm:text-md md:text-lg',
					className
				)}
				key={currentWord}
			>
				{/* edit suggested by Sajal: https://x.com/DewanganSajal */}
				{currentWord.split(' ').map((word, wordIndex) => (
					<motion.span
						key={`${word}-${word.length}-${wordIndex}`}
						initial={{ opacity: 0, y: 5, filter: 'blur(8px)' }}
						animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
						transition={{
							delay: wordIndex * 0.3,
							duration: 0.3,
						}}
						className='inline-block whitespace-pre-wrap sm:whitespace-nowrap'
					>
						{word.split('').map((letter, letterIndex) => (
							<motion.span
								key={`${word}-${letter.length}-${letterIndex}`}
								initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
								animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
								transition={{
									delay: wordIndex * 0.3 + letterIndex * 0.05,
									duration: 0.2,
								}}
								className={cn('inline-block', classNameWords)}
							>
								{letter}
							</motion.span>
						))}
						<span className='inline-block'>&nbsp;</span>
					</motion.span>
				))}
			</motion.div>
		</AnimatePresence>
	)
}
