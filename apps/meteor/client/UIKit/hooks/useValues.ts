import { extractInitialStateFromLayout } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useReducer } from 'react';

type Payload = { value: unknown; blockId?: string };

type ReducerState = { [actionId: string]: Payload };

type ReducerAction = { actionId: string; payload: Payload };

const reducer = (values: ReducerState, { actionId, payload }: ReducerAction): ReducerState => ({
	...values,
	[actionId]: payload,
});

export const useValues = (blocks: UiKit.LayoutBlock[]) => useReducer(reducer, blocks, extractInitialStateFromLayout);
