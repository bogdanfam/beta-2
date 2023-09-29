import { UIKitInteractionType as UIKitInteractionTypeApi } from '@rocket.chat/apps-engine/definition/uikit';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as UiKit from '.';

enum UIKitInteractionTypeExtended {
	BANNER_OPEN = 'banner.open',
	BANNER_UPDATE = 'banner.update',
	BANNER_CLOSE = 'banner.close',
}

export type UIKitInteractionType = UIKitInteractionTypeApi | UIKitInteractionTypeExtended;

export const UIKitInteractionTypes = {
	...UIKitInteractionTypeApi,
	...UIKitInteractionTypeExtended,
};

export type UIKitUserInteraction = {
	type: UIKitInteractionType;
} & UiKit.View;

export type UIKitUserInteractionResult = UIKitUserInteractionResultError | UIKitUserInteraction;

type UIKitUserInteractionResultError = UIKitUserInteraction & {
	type: UIKitInteractionTypeApi.ERRORS;
	errors?: Array<{ [key: string]: string }>;
};

export const isErrorType = (result: UIKitUserInteractionResult): result is UIKitUserInteractionResultError =>
	result.type === UIKitInteractionTypeApi.ERRORS;

export type UIKitActionEvent = {
	blockId: string;
	value?: unknown;
	appId: string;
	actionId: string;
	viewId: string;
};
