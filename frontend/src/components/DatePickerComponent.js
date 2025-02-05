import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import addYears from 'date-fns/addYears';

const DatePickerComponent = ({ onChange }) => {
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    ]);

    const handleSelect = (ranges) => {
        setDateRange([ranges.selection]);
        if (onChange) {
            onChange(ranges.selection);
        }
    };

    return (
        <div>
            <DateRange
                ranges={dateRange}
                onChange={handleSelect}
                moveRangeOnFirstSelection={false}
                showSelectionPreview={true}
                showMonthAndYearPickers={true}
                maxDate={addYears(new Date(), 1)} // Users can select dates up to 1 year in the future
            />
        </div>
    );
};

export default DatePickerComponent;
