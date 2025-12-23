import { useState, useCallback } from "react";
import { logger } from "@/utils/logger";

interface UseDatePickerDebugOptions {
  componentName: string;
  fieldName: string;
}

export const useDatePickerDebug = ({ componentName, fieldName }: UseDatePickerDebugOptions) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    logger.ui(componentName, `${fieldName} Popover`, { 
      action: open ? 'OPEN' : 'CLOSE', 
      previousState: isOpen 
    });
    setIsOpen(open);
  }, [componentName, fieldName, isOpen]);

  const handleTriggerClick = useCallback(() => {
    logger.ui(componentName, `${fieldName} Button CLICKED`, { currentOpen: isOpen });
  }, [componentName, fieldName, isOpen]);

  const handleSelect = useCallback((date: Date | undefined, setDate: (date: Date | undefined) => void) => {
    logger.ui(componentName, `${fieldName} Date SELECTED`, { 
      date: date?.toISOString() || null 
    });
    setDate(date);
    setIsOpen(false);
  }, [componentName, fieldName]);

  return {
    isOpen,
    setIsOpen,
    handleOpenChange,
    handleTriggerClick,
    handleSelect,
  };
};
