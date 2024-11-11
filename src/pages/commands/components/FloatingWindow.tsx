import type React from 'react'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useCookies } from 'react-cookie'
import { useFloatingWindow, type Message } from '@/store/useFloatingWindow'
import { useTranslation } from 'react-i18next'

const FloatingWindow: React.FC = () => {
	const { isMinimized, messages, toggleMinimize, sendCommand, clearMessages, yuukips, setMessage } =
		useFloatingWindow()
	const [input, setInput] = useState<string>('')
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const [cookies] = useCookies(['uid', 'code', 'server'])
	const { t } = useTranslation('', { keyPrefix: 'floating_window' })

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: The `useEffect` dependency array only includes `messages` because we want to scroll to the bottom whenever the messages change. Adding other dependencies might cause unnecessary re-renders.
	useEffect(() => {
		scrollToBottom()
	}, [messages])

	useEffect(() => {
		yuukips.getResponseCommand((response) => {
			const newResponse: Message = {
				id: Date.now().toString(),
				type: 'response',
				content: response.message,
				timestamp: new Date(),
			}

			setMessage(newResponse)
		})

		// Cleanup function to remove the event listener
		return () => {
			yuukips.removeResponseListener()
		}
	}, [setMessage, yuukips])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (input.trim()) {
			sendCommand(cookies.uid, cookies.code, cookies.server, input.trim())
			setInput('')
		}
	}

	return (
		<motion.div
			className={`
                fixed z-50
                md:bottom-6 md:right-6 md:w-96
                bottom-0 right-0 w-full
                bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
                border border-border
                rounded-t-xl md:rounded-xl
                shadow-lg
            `}
			animate={{
				translateY: isMinimized ? `calc(100% - ${window.innerWidth >= 768 ? '3rem' : '3.5rem'})` : '0%',
			}}
			transition={{
				type: 'spring',
				stiffness: 300,
				damping: 30,
			}}
		>
			<div className='relative w-full'>
				<Button
					variant={'ghost'}
					className={`
                        flex items-center justify-between
                        px-4 
                        md:h-12 h-14
                        cursor-pointer
                        rounded-t-xl
                        hover:bg-transparent
                        transition-colors
                        w-full
                    `}
					onClick={toggleMinimize}
					type='button'
					aria-expanded={!isMinimized}
				>
					<h3 className='text-base'>{t('title')}</h3>
					<div
						className={`
                            p-1 rounded-full 
                            hover:bg-transparent
                            transition-transform duration-200
                            md:scale-125 scale-150
                            ${isMinimized ? 'rotate-180' : ''}
                    `}
						aria-label={isMinimized ? 'Expand' : 'Collapse'}
					>
						<ChevronDown className='md:w-5 md:h-5 w-5 h-5' />
					</div>
				</Button>
			</div>

			<AnimatePresence mode='sync'>
				{!isMinimized && (
					<motion.div
						className='overflow-hidden'
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 500, damping: 30 }}
					>
						<div className='flex flex-col md:h-[300px] h-[400px]'>
							<div className='flex-1 overflow-y-auto p-4 space-y-4'>
								{messages.map((msg) => (
									<div
										key={msg.id}
										className={`
                                            flex
                                            ${msg.type === 'command' ? 'justify-end' : 'justify-start'}
                                        `}
									>
										<div
											className={`
                                                max-w-[80%] rounded-lg px-4 py-2
                                                ${msg.type === 'command' ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4'}
                                            `}
										>
											<p className='text-sm'>{msg.content}</p>
											<span className='text-xs opacity-70'>
												{msg.timestamp.toLocaleTimeString()}
											</span>
										</div>
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

							<form onSubmit={handleSubmit} className='p-4 border-t'>
								<div className='flex gap-3'>
									<button
										type='button'
										className='px-3 py-1 bg-primary text-primary-foreground rounded-md'
										onClick={clearMessages}
									>
										{t('button.clear')}
									</button>
									<input
										type='text'
										value={input}
										onChange={(e) => setInput(e.target.value)}
										className='flex-1 px-3 py-2 rounded-md bg-muted'
										placeholder={t('input_placeholder')}
									/>
									<button
										type='submit'
										className='px-4 py-2 bg-primary text-primary-foreground rounded-md'
									>
										{t('button.send')}
									</button>
								</div>
							</form>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

export default FloatingWindow
