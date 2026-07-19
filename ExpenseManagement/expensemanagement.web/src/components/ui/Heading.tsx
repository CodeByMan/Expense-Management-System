
type HeadingProps = {
    HeadTitle: string;
    SubTitle?: string
}
export default function Heading({HeadTitle, SubTitle}: HeadingProps) {
    return (
        <div>
            <h2 className="text-2xl font-black tracking-tight text-on-surface mb-2 sm:text-3xl lg:text-4xl">{HeadTitle}</h2>
            <p className="max-w-2xl text-sm font-medium text-on-surface-variant sm:text-base">{SubTitle} </p>
        </div>
    )
}
