import type { CommandLists, Argument } from '@/pages/commands/App'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { type Dispatch, type SetStateAction, memo } from 'react'
import { SearchArgs, SelectArgs } from './ArgsType'

interface ArgumentsContainerProps {
	cmd: CommandLists
	arg: Argument
	handleArgSelect: (commandId: number, argKey: string, value: string) => void
	selectedArgs: { [key: number]: { [key: string]: string } }
	showResults: boolean
	searchResults: { id: string; name: string; description: string | undefined; image: string | undefined }[]
	setShowResults: Dispatch<SetStateAction<boolean>>
	setSearchResults: Dispatch<
		SetStateAction<{ id: string; name: string; description: string | undefined; image: string | undefined }[]>
	>
	commands: CommandLists[]
}

const ArgumentsContainer = memo(
	({
		cmd,
		arg,
		handleArgSelect,
		selectedArgs,
		showResults,
		searchResults,
		setShowResults,
		setSearchResults,
		commands,
	}: ArgumentsContainerProps) => {
		// Get the updated description based on selected value
		const getUpdatedDescription = () => {
			if (arg.type === 'select') {
				const selectedValue = selectedArgs[cmd.id]?.[arg.key]
				if (selectedValue) {
					const selectedOption = arg.options?.find((opt) => opt.value === selectedValue)
					if (selectedOption?.args?.[0]) {
						// Return the description from the first argument of the selected option
						return selectedOption.args[0].description
					}
				}
			}
			// Return original description if no updates needed
			return arg.description
		}

		const shouldRenderArg = () => {
			const isOriginalArg = cmd.args?.some((cmdArg) => cmdArg.key === arg.key)

			// Check all selected arguments for this command
			for (const cmdArg of cmd.args || []) {
				if (cmdArg.type === 'select') {
					const selectedValue = selectedArgs[cmd.id]?.[cmdArg.key]
					if (!selectedValue) continue

					// Find the selected option
					const selectedOption = cmdArg.options?.find((opt) => opt.value === selectedValue)
					if (!selectedOption) continue

					// If this is an original arg and should be removed
					if (isOriginalArg && selectedOption.remove) {
						if (selectedOption.remove === true) {
							return false
						}
						if (Array.isArray(selectedOption.remove) && selectedOption.remove.includes(arg.key)) {
							return false
						}
					}

					// If this is a replacement arg from the selected option
					if (selectedOption.args) {
						const newArg = selectedOption.args.find((a) => a.key === arg.key)
						if (newArg) {
							// Update the arg properties with the new ones
							Object.assign(arg, newArg)
						}
					}
				}
			}

			return true
		}

		if (!shouldRenderArg()) {
			return null
		}

		const renderArgInput = () => {
			const isOriginalArg = cmd.args?.some((cmdArg) => cmdArg.key === arg.key)
			const listRender = []

			if (isOriginalArg) {
				switch (arg.type) {
					case 'select':
						listRender.push(
							<SelectArgs
								key={`select-${cmd.id}-${arg.key}`}
								handleArgSelect={handleArgSelect}
								cmd={cmd}
								arg={arg}
								selectedArgs={selectedArgs}
							/>
						)
						break
					case 'search':
						listRender.push(
							<SearchArgs
								key={`search-${cmd.id}-${arg.key}`}
								cmd={cmd}
								commands={commands}
								arg={arg}
								showResults={showResults}
								searchResults={searchResults}
								setShowResults={setShowResults}
								setSearchResults={setSearchResults}
								handleArgSelect={handleArgSelect}
							/>
						)
						break
					case 'number':
						listRender.push(
							<NumberInput
								key={`number-${cmd.id}-${arg.key}`}
								cmd={cmd}
								arg={arg}
								handleArgSelect={handleArgSelect}
								selectedArgs={selectedArgs}
							/>
						)
						break
					default:
				}

				if (arg.type === 'select') {
					const selectedValue = selectedArgs[cmd.id]?.[arg.key]
					if (selectedValue) {
						const selectedOption = arg.options?.find((opt) => opt.value === selectedValue)
						if (selectedOption?.args) {
							for (const additionalArg of selectedOption.args) {
								switch (additionalArg.type) {
									case 'select':
										listRender.push(
											<SelectArgs
												key={`additional-select-${cmd.id}-${additionalArg.key}`}
												cmd={cmd}
												arg={additionalArg}
												handleArgSelect={handleArgSelect}
												selectedArgs={selectedArgs}
											/>
										)
										break
									case 'number':
										listRender.push(
											<NumberInput
												key={`additional-number-${cmd.id}-${additionalArg.key}`}
												cmd={cmd}
												arg={additionalArg}
												handleArgSelect={handleArgSelect}
												selectedArgs={selectedArgs}
											/>
										)
										break
								}
							}
						}
					}
				}
			}

			return listRender
		}

		return (
			<div key={`${cmd.id}-${cmd.name}-${arg.key}`} className='space-y-1'>
				<label
					htmlFor={`${cmd.id}-${arg.name}`}
					className='block text-sm font-medium text-gray-700 dark:text-gray-300'
				>
					{arg.key}
					<span className='ml-2 text-sm text-gray-500'>({arg.type})</span>
				</label>
				{renderArgInput()}
				<p className='text-sm text-muted-foreground'>{getUpdatedDescription()}</p>
			</div>
		)
	}
)

interface NumberInputProps {
	cmd: CommandLists
	arg: Argument
	handleArgSelect: (commandId: number, argKey: string, value: string) => void
	selectedArgs: { [key: number]: { [key: string]: string } }
}

const NumberInput = memo(({ cmd, arg, handleArgSelect, selectedArgs }: NumberInputProps) => {
	if (arg.limit) {
		return (
			<>
				<div className='flex items-center mb-2 space-x-1'>
					<Label htmlFor={`toggle-${cmd.id}-${arg.key}`} className='text-sm'>
						Use Slider
					</Label>
					<Checkbox
						id={`toggle-${cmd.id}-${arg.key}`}
						onCheckedChange={(e) => {
							handleArgSelect(cmd.id, `${arg.key}-useSlider`, e.toString())
						}}
						checked={selectedArgs[cmd.id]?.[`${arg.key}-useSlider`] === 'true'}
					/>
				</div>
				{selectedArgs[cmd.id]?.[`${arg.key}-useSlider`] === 'true' ? (
					<Slider
						min={arg.limit.min}
						max={arg.limit.max}
						onValueChange={(e) => {
							handleArgSelect(cmd.id, arg.key, e[0].toString())
						}}
						className='w-full'
					/>
				) : (
					<Input
						type='number'
						min={arg.limit.min}
						max={arg.limit.max}
						onChange={(e) => {
							handleArgSelect(cmd.id, arg.key, e.target.value)
						}}
						placeholder={`Enter ${arg.name}`}
						className='w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors duration-200'
					/>
				)}
			</>
		)
	}

	return (
		<Input
			type='number'
			onChange={(e) => {
				handleArgSelect(cmd.id, arg.key, e.target.value)
			}}
			placeholder={`Enter ${arg.name}`}
			className='w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors duration-200'
		/>
	)
})

export default ArgumentsContainer
