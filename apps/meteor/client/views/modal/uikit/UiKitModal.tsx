import type { UiKit } from '@rocket.chat/core-typings';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { ContextType, FormEvent } from 'react';
import React, { useMemo } from 'react';

import { useUiKitActionManager } from '../../../UIKit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../../UIKit/hooks/useUiKitView';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import { preventSyntheticEvent } from '../../../lib/utils/preventSyntheticEvent';
import ModalBlock from './ModalBlock';

const groupStateByBlockId = (values: { [actionId: string]: { value: unknown; blockId?: string } | undefined }) =>
	Object.entries(values).reduce<{ [blockId: string]: { [actionId: string]: unknown } }>((obj, [key, payload]) => {
		if (!payload?.blockId) {
			return obj;
		}

		const { blockId, value } = payload;
		obj[blockId] = obj[blockId] || {};
		obj[blockId][key] = value;

		return obj;
	}, {});

type UiKitModalProps = {
	key: UiKit.ModalView['viewId']; // force re-mount when viewId changes
	initialView: UiKit.ModalView;
};

const UiKitModal = ({ initialView }: UiKitModalProps) => {
	const actionManager = useUiKitActionManager();
	const { view, errors, values, updateValues } = useUiKitView(initialView);

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);

	// TODO: this structure is atrociously wrong; we should revisit this
	const contextValue = useMemo(
		(): ContextType<typeof UiKitContext> => ({
			action: async ({ actionId, viewId, appId, dispatchActionConfig }) => {
				if (!appId || !viewId) {
					return;
				}

				const emit = dispatchActionConfig?.includes('on_character_entered') ? debouncedEmitInteraction : emitInteraction;

				await emit(appId, {
					type: 'blockAction',
					actionId,
					container: {
						type: 'view',
						id: viewId,
					},
					payload: view,
				});
			},
			state: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
				updateValues({
					actionId,
					payload: {
						blockId,
						value,
					},
				});
			},
			...view,
			values,
		}),
		[debouncedEmitInteraction, emitInteraction, updateValues, values, view],
	);

	const handleSubmit = useMutableCallback((e) => {
		preventSyntheticEvent(e);
		actionManager.triggerSubmitView({
			viewId: view.viewId,
			appId: view.appId,
			payload: {
				view: {
					...view,
					id: view.viewId,
					state: groupStateByBlockId(values),
				},
			},
		});
	});

	const handleCancel = useMutableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					view: {
						...view,
						id: view.viewId,
						state: groupStateByBlockId(values),
					},
					isCleared: false,
				},
			})
			.finally(() => {
				actionManager.disposeView(view.viewId);
			});
	});

	const handleClose = useMutableCallback(() => {
		void actionManager
			.emitInteraction(view.appId, {
				type: 'viewClosed',
				payload: {
					view: {
						...view,
						id: view.viewId,
						state: groupStateByBlockId(values),
					},
					isCleared: true,
				},
			})
			.finally(() => {
				actionManager.disposeView(view.viewId);
			});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<MarkupInteractionContext.Provider
				value={{
					detectEmoji,
				}}
			>
				<ModalBlock view={view} errors={errors} appId={view.appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
			</MarkupInteractionContext.Provider>
		</UiKitContext.Provider>
	);
};

export default UiKitModal;
