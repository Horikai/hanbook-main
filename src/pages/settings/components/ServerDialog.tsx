import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

interface ServerDialogProps {
	open: boolean
	onClose: () => void
	uid: string
	onUidChange: (value: string) => void
	onSave: () => void
}

const ServerDialog: React.FC<ServerDialogProps> = ({ open, onClose, uid, onUidChange, onSave }) => {
	const { t } = useTranslation('translation', {
		keyPrefix: 'list_server_available.dialog',
	})

	return (
		<Dialog open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
					<DialogDescription className='select-none'>{t('description')}</DialogDescription>
				</DialogHeader>
				<Input
					value={uid}
					type='number'
					onChange={(e) => onUidChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							onSave()
						}
					}}
					placeholder={t('input_placeholder')}
				/>
				<DialogFooter>
					<Button variant={'outline'} onClick={onClose}>
						{t('button.cancel')}
					</Button>
					<Button onClick={onSave}>{t('button.save')}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default ServerDialog
