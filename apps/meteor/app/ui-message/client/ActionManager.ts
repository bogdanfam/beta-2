import type { UiKit, DistributiveOmit } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import type { ActionManagerContext } from '@rocket.chat/ui-contexts';
import type { ContextType } from 'react';
import { lazy } from 'react';

import * as banners from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { router } from '../../../client/providers/RouterProvider';
import { sdk } from '../../utils/client/lib/SDKClient';
import { UiKitTriggerTimeoutError } from './UiKitTriggerTimeoutError';

const UiKitModal = lazy(() => import('../../../client/views/modal/uikit/UiKitModal'));

type ActionManagerType = Exclude<ContextType<typeof ActionManagerContext>, undefined>;

class ActionManager implements ActionManagerType {
	public static readonly TRIGGER_TIMEOUT = 5000;

	protected events = new Emitter<{
		busy: { busy: boolean };
		[viewId: string]: any;
	}>();

	protected triggersId = new Map<string, string | undefined>();

	protected invalidateTriggerId(triggerId: string) {
		const appId = this.triggersId.get(triggerId);
		this.triggersId.delete(triggerId);
		return appId;
	}

	protected viewInstances = new Map<string, { payload?: any; close: () => void }>();

	public on = this.events.on.bind(this.events);

	public off = this.events.off.bind(this.events);

	public generateTriggerId(appId: string | undefined) {
		const triggerId = Random.id();
		this.triggersId.set(triggerId, appId);
		setTimeout(() => this.invalidateTriggerId(triggerId), ActionManager.TRIGGER_TIMEOUT);
		return triggerId;
	}

	public async emitInteraction(appId: string, userInteraction: DistributiveOmit<UiKit.UserInteraction, 'triggerId'>) {
		this.events.emit('busy', { busy: true });

		const triggerId = this.generateTriggerId(appId);

		let timeout: ReturnType<typeof setTimeout> | undefined;

		try {
			return new Promise((resolve, reject) => {
				timeout = setTimeout(() => reject(new UiKitTriggerTimeoutError('Timeout', { triggerId, appId })), ActionManager.TRIGGER_TIMEOUT);

				sdk.rest
					.post(`/apps/ui.interaction/${appId}`, {
						...userInteraction,
						triggerId,
					})
					.then(({ type, ...data }) => {
						resolve(this.handlePayloadUserInteraction(type, data));
					}, reject);
			});
		} finally {
			if (timeout) clearTimeout(timeout);
			this.events.emit('busy', { busy: false });
		}
	}

	public handlePayloadUserInteraction(this: this, type: any, { triggerId, ...data }: any) {
		if (!this.triggersId.has(triggerId)) {
			return;
		}
		const appId = this.invalidateTriggerId(triggerId);
		if (!appId) {
			return;
		}

		const { view } = data;
		const viewId = view?.id ?? data.viewId;

		if (!viewId) {
			return;
		}

		if (type === 'errors') {
			this.events.emit(viewId, {
				type,
				triggerId,
				viewId,
				appId,
				...data,
			});
			return 'errors';
		}

		if (type === 'banner.update' || type === 'contextual_bar.update') {
			this.events.emit(viewId, {
				type,
				triggerId,
				viewId,
				appId,
				...data,
			});
			return type;
		}

		if (type === 'modal.open') {
			const instance = imperativeModal.open({
				component: UiKitModal,
				props: {
					key: data.view.id,
					initialView: {
						viewId: data.view.id,
						appId: data.view.appId,
						blocks: data.view.blocks,
						title: data.view.title,
						close: data.view.close,
						showIcon: data.view.showIcon,
						submit: data.view.submit,
					},
				},
			});

			this.viewInstances.set(viewId, {
				close: () => {
					instance.close();
					this.viewInstances.delete(viewId);
				},
			});

			return type;
		}

		if (type === 'modal.update') {
			this.events.emit(viewId, {
				type,
				triggerId,
				viewId: data.view.id,
				appId: data.view.appId,
				blocks: data.view.blocks,
				title: data.view.title,
				close: data.view.close,
				showIcon: data.view.showIcon,
				submit: data.view.submit,
			});

			return type;
		}

		if (type === 'contextual_bar.open') {
			this.viewInstances.set(viewId, {
				payload: {
					type,
					triggerId,
					appId,
					viewId,
					...data,
				},
				close: () => {
					this.viewInstances.delete(viewId);
				},
			});

			router.navigate({
				name: router.getRouteName()!,
				params: {
					...router.getRouteParameters(),
					tab: 'app',
					context: viewId,
				},
			});

			return 'contextual_bar.open';
		}

		if (type === 'banner.open') {
			banners.open(data);
			this.viewInstances.set(viewId, {
				close() {
					banners.closeById(viewId);
				},
			});

			return 'banner.open';
		}

		if (type === 'banner.close') {
			this.disposeView(viewId);
			return 'banner.close';
		}

		if (type === 'contextual_bar.close') {
			this.disposeView(viewId);
			return 'contextual_bar.close';
		}

		if (type === 'modal.close') {
			this.disposeView(viewId);
			return 'modal.close';
		}

		throw new Error(`Unknown type: ${type}`);
	}

	public async triggerAction({ type, appId, ...rest }: Parameters<ActionManagerType['triggerAction']>[0]) {
		this.events.emit('busy', { busy: true });

		const triggerId = this.generateTriggerId(appId);

		let timeout: ReturnType<typeof setTimeout> | undefined;

		try {
			return new Promise((resolve, reject) => {
				timeout = setTimeout(() => reject(new UiKitTriggerTimeoutError('Timeout', { triggerId, appId })), ActionManager.TRIGGER_TIMEOUT);

				sdk.rest
					.post(`/apps/ui.interaction/${appId}`, {
						...rest,
						type,
						payload: 'payload' in rest ? rest.payload : rest,
						triggerId,
					} as any)
					.then(({ type, ...data }) => {
						resolve(this.handlePayloadUserInteraction(type, data));
					}, reject);
			});
		} finally {
			if (timeout) clearTimeout(timeout);
			this.events.emit('busy', { busy: false });
		}
	}

	public async triggerSubmitView({ viewId, ...options }: any): Promise<void> {
		const close = () => {
			const instance = this.viewInstances.get(viewId);

			if (instance) {
				instance.close();
			}
		};

		try {
			const result = await this.triggerAction({
				type: 'viewSubmit',
				viewId,
				...options,
			});
			if (!result || result === 'modal.close') {
				close();
			}
		} catch {
			close();
		}
	}

	public getUserInteractionPayloadByViewId(viewId: string) {
		if (!viewId) {
			throw new Error('No viewId provided when checking for `user interaction payload`');
		}

		const instance = this.viewInstances.get(viewId);

		if (!instance) {
			return undefined;
		}

		return instance.payload;
	}

	public disposeView(viewId: UiKit.View['viewId']) {
		const instance = this.viewInstances.get(viewId);
		instance?.close?.();
		this.viewInstances.delete(viewId);
	}
}

/** @deprecated consumer should use the context instead */
export const actionManager = new ActionManager();
