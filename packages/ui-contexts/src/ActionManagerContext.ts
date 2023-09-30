import type { IMessage, IRoom, UiKit } from '@rocket.chat/core-typings';
import { createContext } from 'react';

type BlockActionTriggerOptions =
	| {
			type: 'blockAction';
			actionId: string;
			appId: string;
			container: {
				type: 'view';
				id: UiKit.View['viewId'];
			};
			visitor?: unknown;
	  }
	| {
			type: 'blockAction';
			actionId: string;
			appId: string;
			container: {
				type: 'message';
				id: UiKit.View['viewId'];
			};
			rid: IRoom['_id'];
			mid: IMessage['_id'];
			visitor?: unknown;
	  };

type ViewClosedTriggerOptions = {
	type: 'viewClosed';
	appId: string;
	viewId: UiKit.View['viewId'];
	view: UiKit.View & { id: UiKit.View['viewId']; state?: Record<string, unknown> };
	isCleared: boolean;
};

type ViewSubmitTriggerOptions = {
	type: 'viewSubmit';
	appId: string;
	viewId: UiKit.View['viewId'];
	actionId?: string;
	triggerId?: string;
	payload: {
		view: UiKit.View & { id: UiKit.View['viewId']; state?: Record<string, unknown> };
	};
};

type TriggerOptions = BlockActionTriggerOptions | ViewClosedTriggerOptions | ViewSubmitTriggerOptions;

/**
 * Utility type to remove the `type` property from an **union** of objects.
 */
type WithoutType<X> = X extends { type: any } ? Omit<X, 'type'> : X;

type ActionManagerContextValue = {
	on: {
		(viewId: string, listener: (...args: any[]) => any): void;
		(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	};
	off: {
		(viewId: string, listener: (...args: any[]) => any): void;
		(eventName: 'busy', listener?: ({ busy }: { busy: boolean }) => void): void;
	};
	generateTriggerId: (appId: any) => string;
	handlePayloadUserInteraction: (
		type: any,
		{
			triggerId,
			...data
		}: {
			[x: string]: any;
			triggerId: any;
		},
	) => any;
	triggerAction(action: TriggerOptions): Promise<void>;
	triggerAction({
		type,
		actionId,
		appId,
		rid,
		mid,
		viewId,
		container,
		tmid,
		...rest
	}: {
		[x: string]: any;
		type: any;
		actionId: any;
		appId: any;
		rid: any;
		mid: any;
		viewId: any;
		container: any;
		tmid: any;
	}): Promise<any>;
	triggerBlockAction(options: WithoutType<BlockActionTriggerOptions>): Promise<void>;
	triggerCancel(options: WithoutType<ViewClosedTriggerOptions>): Promise<void>;
	triggerSubmitView(options: WithoutType<ViewSubmitTriggerOptions>): Promise<void>;
	triggerActionButtonAction: (options: any) => Promise<any>;
	getUserInteractionPayloadByViewId: (viewId: any) => any;
};

export const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);
