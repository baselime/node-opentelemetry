

export function safely(cb: () => any) {
    try {
        return cb();
    } catch (e) {
        return undefined;
    }
}