import type { UiKit } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext, bannerParser, UiKitBanner as UiKitBannerSurfaceRender, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ContextType } from 'react';
import React, { useMemo } from 'react';

import { useUiKitActionManager } from '../../UIKit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../UIKit/hooks/useUiKitView';
import MarkdownText from '../../components/MarkdownText';
import * as banners from '../../lib/banners';

// TODO: move this to fuselage-ui-kit itself
bannerParser.mrkdwn = ({ text }): ReactElement => <MarkdownText variant='inline' content={text} />;

type UiKitBannerProps = {
	key: UiKit.BannerView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.BannerView;
};

const UiKitBanner = ({ initialView }: UiKitBannerProps) => {
	const { view, values } = useUiKitView(initialView);

	const icon = useMemo(() => {
		if (view.icon) {
			return <Icon name={view.icon} size='x20' />;
		}

		return null;
	}, [view.icon]);

	const dispatchToastMessage = useToastMessageDispatch();
	const handleClose = useMutableCallback(() =>
		actionManager
			.triggerCancel({
				appId: view.appId,
				viewId: view.viewId,
				view: {
					...view,
					id: view.viewId,
				},
				isCleared: true,
			})
			.then(() => banners.close())
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
				banners.close();
				return Promise.reject(error);
			}),
	);

	const actionManager = useUiKitActionManager();

	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ appId, viewId, actionId }): Promise<void> => {
				if (!appId || !viewId) {
					return;
				}

				await actionManager.triggerBlockAction({
					container: {
						type: 'view',
						id: viewId,
					},
					actionId,
					appId,
				});
				banners.closeById(view.viewId);
			},
			state: (): void => undefined,
			appId: view.appId,
			values,
		}),
		[actionManager, view.appId, view.viewId, values],
	);

	return (
		<Banner icon={icon} inline={view.inline} title={view.title} variant={view.variant} closeable onClose={handleClose}>
			<UiKitContext.Provider value={contextValue}>
				<UiKitComponent render={UiKitBannerSurfaceRender} blocks={view.blocks} />
			</UiKitContext.Provider>
		</Banner>
	);
};

export default UiKitBanner;
