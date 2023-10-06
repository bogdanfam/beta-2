import type { IMessage } from '../IMessage';
import type { IRoom } from '../IRoom';
import type { View } from './View';

export type UserInteraction =
	| {
			type: 'blockAction';
			actionId: string;
			triggerId: string;
			mid?: undefined;
			rid?: undefined;
			payload: View;
			container: {
				type: 'view';
				id: View['viewId'];
			};
			visitor?: unknown;
	  }
	| {
			type: 'blockAction';
			actionId: string;
			triggerId: string;
			mid: IMessage['_id'];
			rid: IRoom['_id'];
			payload?: undefined;
			container: {
				type: 'message';
				id: View['viewId'];
			};
			visitor?: unknown;
	  }
	| {
			type: 'viewSubmit';
			actionId?: string;
			triggerId: string;
			payload: View & { id: View['viewId']; state?: { [blockId: string]: { [actionId: string]: unknown } } };
	  }
	| {
			type: 'viewClosed';
			actionId?: string;
			triggerId: string;
			payload: {
				view: View & { id: View['viewId']; state?: { [blockId: string]: { [actionId: string]: unknown } } };
				isCleared: boolean;
			};
	  }
	| {
			type: 'actionButton';
			actionId: string;
			triggerId: string;
			payload: { context: 'userDropdownAction' };
	  }
	| {
			type: 'actionButton';
			actionId: string;
			triggerId: string;
			rid: IRoom['_id'];
			payload: { context: 'roomAction' };
	  }
	| {
			type: 'actionButton';
			actionId: string;
			triggerId: string;
			rid: IRoom['_id'];
			tmid?: IMessage['_id'];
			payload: {
				context: 'messageBoxAction';
				message?: string;
			};
	  }
	| {
			type: 'actionButton';
			actionId: string;
			triggerId: string;
			rid: IRoom['_id'];
			mid: IMessage['_id'];
			tmid?: IMessage['_id'];
			payload: { context: 'messageAction' };
	  };
