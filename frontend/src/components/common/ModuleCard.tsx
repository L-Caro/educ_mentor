import React from "react";
import { useNavigate } from 'react-router-dom';
import Button from "src/components/common/Button.tsx";
import type { AppModule } from 'src/types';

interface ModuleCardProps {
  module: AppModule;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/module/${module.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/module/${module.id}`);
    }
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/module/${module.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="ModuleCard"
    >
      <div className="ModuleCard__body">
        <div className="ModuleCard__icon" aria-hidden="true">
          {module.icon}
        </div>

        <h2 className="ModuleCard__title">
          {module.name}
        </h2>

        {module.description && (
          <p className="ModuleCard__description">
            {module.description}
          </p>
        )}

        <Button title={"Ouvrir"} onClick={handleButtonClick} />

      </div>
    </div>
  );
}
