import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { api } from '../../shared/api/axios';
import { useDemoStore } from './store';
import { resolveDemoMock } from './mockData';

const buildMockResponse = <T = unknown>(config: InternalAxiosRequestConfig, data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: config.headers,
    config,
    request: {},
});

export const installDemoAdapter = (): void => {
    const currentAdapter = api.defaults.adapter;
    if (typeof currentAdapter === 'function') return;

    const realAdapter = axios.getAdapter(currentAdapter);

    const demoAdapter: AxiosAdapter = (config) => {
        if (!useDemoStore.getState().isDemoMode) {
            return realAdapter(config);
        }

        const method = (config.method || 'get').toLowerCase();
        const path = config.url || '';
        const body = typeof config.data === 'object' && config.data !== null ? config.data : {};
        const params = { ...(config.params || {}), ...body };
        const data = resolveDemoMock(method, path, params);
        return Promise.resolve(buildMockResponse(config, data));
    };

    api.defaults.adapter = demoAdapter;
};