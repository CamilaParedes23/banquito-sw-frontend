import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Línea de progreso */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div 
            className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isPending = currentStep < step.number;

          return (
            <div key={step.number} className="flex flex-col items-center flex-1">
              {/* Círculo del paso */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-lg scale-110'
                    : isCurrent
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl scale-125 ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : step.number}
              </div>

              {/* Texto del paso */}
              <div className="mt-3 text-center">
                <p
                  className={`text-sm font-semibold ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
