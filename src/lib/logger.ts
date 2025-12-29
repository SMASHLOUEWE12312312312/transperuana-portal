const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    debug: (msg: string, data?: unknown) => isDev && console.debug(msg, data),
    info: (msg: string, data?: unknown) => isDev && console.info(msg, data),
    error: (msg: string, err?: unknown) => console.error(msg, err),
};

export default logger;
