import type { IMessage, IRoom, UiKit } from '@rocket.chat/core-typings';
import { createContext } from 'react';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface ActionManagerUserInteractionsMap extends Record<UiKit.UserInteraction['type'], object> {
	blockAction:
		| {
				actionId: string;
				appId: string;
				container: {
					type: 'view';
					id: UiKit.View['viewId'];
				};
				visitor?: unknown;
		  }
		| {
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
	viewClosed: {
		appId: string;
		viewId: UiKit.View['viewId'];
		view: UiKit.View & { id: UiKit.View['viewId']; state?: Record<string, unknown> };
		isCleared: boolean;
	};
	viewSubmit: {
		appId: string;
		viewId: UiKit.View['viewId'];
		actionId?: string;
		triggerId?: string;
		payload: {
			view: UiKit.View & { id: UiKit.View['viewId']; state?: Record<string, unknown> };
		};
	};
	actionButton:
		| {
				appId: string;
				actionId: string;
				payload: { context: 'userDropdownAction' };
		  }
		| {
				appId: string;
				actionId: string;
				rid: IRoom['_id'];
				payload: { context: 'roomAction' };
		  }
		| {
				appId: string;
				actionId: string;
				rid: IRoom['_id'];
				tmid?: IMessage['_id'];
				payload: {
					context: 'messageBoxAction';
					message?: string;
				};
		  }
		| {
				appId: string;
				actionId: string;
				rid: IRoom['_id'];
				mid: IMessage['_id'];
				tmid?: IMessage['_id'];
				payload: { context: 'messageAction' };
		  };
}

type ActionMangerUserInteraction = {
	[TType in keyof ActionManagerUserInteractionsMap as number]: { type: TType } & ActionManagerUserInteractionsMap[TType];
}[number];

type ActionManagerContextValue = {
	on(viewId: string, listener: (data: any) => void): void;
	on(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	off(viewId: string, listener: (data: any) => any): void;
	off(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	generateTriggerId(appId: string | undefined): string;
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
	triggerAction(action: ActionMangerUserInteraction): Promise<unknown>;
	triggerBlockAction(options: ActionManagerUserInteractionsMap['blockAction']): Promise<void>;
	triggerCancel(options: ActionManagerUserInteractionsMap['viewClosed']): Promise<void>;
	triggerSubmitView(options: ActionManagerUserInteractionsMap['viewSubmit']): Promise<void>;
	triggerActionButtonAction(options: ActionManagerUserInteractionsMap['actionButton']): Promise<any>;
	getUserInteractionPayloadByViewId: (viewId: any) => any;
};

export const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);
