interface EnergyTokenProps {
  label: string;
  detail?: string;
}

export const EnergyToken = ({ label, detail }: EnergyTokenProps): JSX.Element => {
  return (
    <div
      data-energy-token
      className="energy-token inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border-[3px] border-kac-iron bg-[radial-gradient(circle_at_35%_30%,#fff8cc_0%,#ffd23b_55%,#c37509_100%)] px-2 py-1 text-kac-iron shadow-[2px_2px_0_0_#121b23]"
      title={detail}
    >
      <span className="font-heading text-lg font-bold leading-none">{label}</span>
    </div>
  );
};
