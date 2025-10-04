'use client';

import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
}

export default function WizardProgress({ currentStep, totalSteps, steps }: WizardProgressProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium
                  ${step.number < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.number === currentStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                  }
                `}
              >
                {step.number < currentStep ? (
                  <Check size={16} />
                ) : (
                  step.number
                )}
              </div>

              {/* Step Info */}
              <div className="mt-2 text-center max-w-24">
                <div
                  className={`text-xs font-medium ${
                    step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    step.number <= currentStep ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-12 mx-4 mb-8
                  ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <div className="text-center mt-2 text-sm text-gray-600">
        Paso {currentStep} de {totalSteps}
      </div>
    </div>
  );
}
