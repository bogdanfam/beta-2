import { States, StatesIcon, StatesSubtitle, StatesTitle, StatesActions, StatesAction, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const UpgradePageError = (): ReactElement => {
	const t = useTranslation();
	const handleReconnect = (): void => window.location.reload();

	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name='globe-cross' />
				<StatesTitle>{t('Connection_error')}</StatesTitle>
				<StatesSubtitle>{t('Upgrade_tab_connection_error_description')}</StatesSubtitle>
				<StatesSubtitle>
					<strong>{t('Upgrade_tab_connection_error_restore')}</strong>
				</StatesSubtitle>
				<StatesActions>
					<StatesAction icon='reload' onClick={handleReconnect}>
						{t('Refresh')}
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default UpgradePageError;
