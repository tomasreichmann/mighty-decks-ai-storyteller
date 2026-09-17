import { cn } from "../../utils/cn";
import type { LabelColor } from "./Label";

export type StepNavigationStep = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
};

export type StepNavigationProps = {
  /** Ordered progress stages. IDs must be unique within the navigation. */
  steps: readonly StepNavigationStep[];
  /** ID of the step currently in view. */
  currentStep: string;
  /** Makes href-less, enabled steps keyboard-accessible change controls. */
  onStepChange?: (stepId: string) => void;
  /** Accent used for the current step. */
  color?: LabelColor;
  className?: string;
};

const currentNodeColorClasses: Record<LabelColor, string> = {
  gold: "border-kac-iron bg-kac-gold text-kac-iron",
  fire: "border-kac-iron bg-kac-fire-light text-kac-iron-dark",
  blood: "border-kac-iron bg-kac-blood-light text-kac-iron-dark",
  bone: "border-kac-iron bg-kac-bone text-kac-iron",
  steel: "border-kac-iron bg-kac-steel-light text-kac-iron",
  skin: "border-kac-iron bg-kac-skin text-kac-iron",
  cloth: "border-kac-iron bg-kac-cloth-light text-kac-iron",
  curse: "border-kac-iron bg-kac-curse-light text-kac-iron-dark",
  monster: "border-kac-iron bg-kac-monster-light text-kac-iron",
};

/**
 * A compact, semantic progress navigator. Steps remain links when a URL is
 * supplied; without navigation or an explicit handler, they are read-only
 * progress status rather than imitation buttons.
 */
export const StepNavigation = ({
  steps,
  currentStep,
  onStepChange,
  color = "gold",
  className,
}: StepNavigationProps): JSX.Element => {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Progress" className={cn("step-navigation w-full", className)}>
      <ol className="grid grid-cols-2 gap-x-2 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-0 sm:gap-y-3">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isComplete = currentIndex >= 0 && index < currentIndex;
          const isDisabled = step.disabled === true;
          const isInteractiveButton = !isDisabled && step.href === undefined && onStepChange !== undefined;
          const state = isCurrent ? "current" : isComplete ? "complete" : "future";
          const nodeClasses = cn(
            "step-navigation__node grid h-8 w-8 place-items-center rounded-full border-2 font-ui text-xs font-bold leading-none shadow-[1px_1px_0_0_#121b23] transition-colors",
            isCurrent
              ? currentNodeColorClasses[color]
              : isComplete
                ? "border-kac-iron bg-kac-cloth-light text-kac-iron"
                : "border-kac-iron bg-kac-bone-light text-kac-iron-light",
            isDisabled && "opacity-55",
          );
          const labelClasses = cn(
            "step-navigation__label mt-1 text-center font-ui text-2xs font-bold uppercase tracking-[0.08em]",
            isCurrent ? "text-kac-iron" : isComplete ? "text-kac-cloth-dark" : "text-kac-iron-light",
            isDisabled && "opacity-60",
          );
          const itemContent = (
            <>
              <span aria-hidden="true" className={nodeClasses}>{index + 1}</span>
              <span className={labelClasses}>{step.label}</span>
            </>
          );

          return (
            <li
              key={step.id}
              className="relative flex min-w-0 flex-col items-center sm:min-w-[4.75rem] sm:flex-1"
              data-step-state={state}
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "step-navigation__connector absolute top-4 left-[calc(50%+1rem)] right-[calc(-50%+1rem)] hidden h-px sm:block",
                    "bg-kac-iron",
                  )}
                />
              ) : null}
              {isDisabled ? (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled
                  className="relative z-10 flex min-w-0 flex-col items-center"
                  data-step-kind="status"
                >
                  {itemContent}
                </span>
              ) : step.href !== undefined ? (
                <a
                  aria-current={isCurrent ? "step" : undefined}
                  className="relative z-10 flex min-w-0 flex-col items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kac-iron"
                  href={step.href}
                  data-step-kind="link"
                >
                  {itemContent}
                </a>
              ) : isInteractiveButton ? (
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className="relative z-10 flex min-w-0 flex-col items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kac-iron"
                  data-step-kind="button"
                  onClick={() => onStepChange(step.id)}
                  type="button"
                >
                  {itemContent}
                </button>
              ) : (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className="relative z-10 flex min-w-0 flex-col items-center"
                  data-step-kind="status"
                >
                  {itemContent}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
