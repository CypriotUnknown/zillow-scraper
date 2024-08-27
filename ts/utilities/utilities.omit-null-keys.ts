type AnyObject = { [key: string]: any };

export default function objectOmittingKeys<T extends AnyObject, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const newObj: Partial<T> = { ...obj };
    for (const key of keys) {
        delete newObj[key];
    }
    return newObj as Omit<T, K>;
}

export function omitNullFields<T extends Record<string, any>>(params: { object: T, keys?: Array<keyof T> }): Partial<T> {
    const result = {} as any;

    const { object, keys } = params;

    Object.keys(object)
        .forEach(key => {
            if (keys) {
                if (keys.includes(key)) {
                    if (object[key] !== null) {
                        result[key] = object[key];
                    }
                } else {
                    result[key] = object[key];
                }
            } else {
                if (object[key] !== null) {
                    result[key] = object[key];
                }
            }

        });

    return result as Partial<T>;
}