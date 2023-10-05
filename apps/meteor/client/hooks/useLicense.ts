import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useLicense = () => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.info');
	const canViewLicense = usePermission('view-privileged-setting');

	return useQuery(
		['licenses', 'getLicenses'],
		async () => {
			if (!canViewLicense) {
				throw new Error('unauthorized api call');
			}

			const { data } = await getLicenses({ loadValues: true });

			return data;
		},
		{
			staleTime: Infinity,
			keepPreviousData: true,
		},
	);
};
