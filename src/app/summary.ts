export interface SummaryPair {
    label: string;
    value: string | number;
}

interface SummaryColumn {
    key: string;
    displayLabel: string;
    csvHeader: string;
    decimals?: number;
    displayUnit?: string;
}

export const PARTICIPANT_COLUMNS: SummaryColumn[] = [
    { key: 'name', displayLabel: 'Name', csvHeader: 'Participant Name' },
    { key: 'alias', displayLabel: 'Andrew ID', csvHeader: 'Andrew ID' },
    { key: 'type', displayLabel: 'Participant Type', csvHeader: 'Participant Type' },
    { key: 'device', displayLabel: 'Device', csvHeader: 'Device' },
    { key: 'deviceDetails', displayLabel: 'Device Details', csvHeader: 'Device Details' },
    { key: 'experience', displayLabel: 'Experience', csvHeader: 'Experience' },
    { key: 'deviceDiagonal', displayLabel: 'Screen Diagonal', csvHeader: 'Screen Diagonal (in)' }
];

export const RUN_COLUMNS: SummaryColumn[] = [
    { key: 'run', displayLabel: 'Run', csvHeader: 'Run' },
    { key: 'radius', displayLabel: 'Size', csvHeader: 'Target Diameter (cm)', decimals: 2, displayUnit: 'cm' },
    { key: 'distance', displayLabel: 'Distance', csvHeader: 'Target Distance (cm)', decimals: 2, displayUnit: 'cm' }
];

export const METRIC_COLUMNS: SummaryColumn[] = [
    { key: 'averageTicks', displayLabel: 'Average Ticks', csvHeader: 'Average Movement Time (ms)', decimals: 2, displayUnit: 'ms' },
    { key: 'averageVerticalTicks', displayLabel: 'Average Vertical Ticks', csvHeader: 'Average Vertical Movement Time (ms)', decimals: 2, displayUnit: 'ms' },
    { key: 'averageHorizontalTicks', displayLabel: 'Average Horizontal Ticks', csvHeader: 'Average Horizontal Movement Time (ms)', decimals: 2, displayUnit: 'ms' },
    { key: 'averageOtherTicks', displayLabel: 'Average Other Ticks', csvHeader: 'Average Other-Direction Movement Time (ms)', decimals: 2, displayUnit: 'ms' },
    { key: 'hits', displayLabel: 'Hits', csvHeader: 'Total Hits (count)' },
    { key: 'misses', displayLabel: 'Misses', csvHeader: 'Total Misses (count)' },
    { key: 'verticalHits', displayLabel: 'Vertical Hits', csvHeader: 'Vertical Hits (count)' },
    { key: 'verticalMisses', displayLabel: 'Vertical Misses', csvHeader: 'Vertical Misses (count)' },
    { key: 'horizontalHits', displayLabel: 'Horizontal Hits', csvHeader: 'Horizontal Hits (count)' },
    { key: 'horizontalMisses', displayLabel: 'Horizontal Misses', csvHeader: 'Horizontal Misses (count)' },
    { key: 'otherHits', displayLabel: 'Other Hits', csvHeader: 'Other-Direction Hits (count)' },
    { key: 'otherMisses', displayLabel: 'Other Misses', csvHeader: 'Other-Direction Misses (count)' },
    { key: 'hitPercentage', displayLabel: 'Hit Percentage', csvHeader: 'Overall Hit Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'missPercentage', displayLabel: 'Miss Percentage', csvHeader: 'Overall Miss Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'verticalHitPercentage', displayLabel: 'Vertical Hit Percentage', csvHeader: 'Vertical Hit Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'verticalMissPercentage', displayLabel: 'Vertical Miss Percentage', csvHeader: 'Vertical Miss Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'horizontalHitPercentage', displayLabel: 'Horizontal Hit Percentage', csvHeader: 'Horizontal Hit Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'horizontalMissPercentage', displayLabel: 'Horizontal Miss Percentage', csvHeader: 'Horizontal Miss Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'otherDirectionHitPercentage', displayLabel: 'Other Direction Hit Percentage', csvHeader: 'Other-Direction Hit Rate (%)', decimals: 2, displayUnit: '%' },
    { key: 'otherDirectionMissPercentage', displayLabel: 'Other Direction Miss Percentage', csvHeader: 'Other-Direction Miss Rate (%)', decimals: 2, displayUnit: '%' }
];

const CSV_COLUMNS = [...PARTICIPANT_COLUMNS, ...RUN_COLUMNS, ...METRIC_COLUMNS];

export function toSummaryPairs(data: Record<string, any>, columns: SummaryColumn[]): SummaryPair[] {
    return columns.map(column => ({
        label: column.displayLabel,
        value: formatDisplayValue(data?.[column.key], column)
    }));
}

export function createSummaryCsv(
    participant: Record<string, any>,
    runs: Array<Record<string, any>>,
    overall: Record<string, any>
): string {
    const rows = runs.map(run => ({ ...participant, ...run }));
    rows.push({ ...participant, ...overall, run: 'OVERALL', radius: '', distance: '' });

    return [
        CSV_COLUMNS.map(column => escapeCsv(column.csvHeader)).join(','),
        ...rows.map(row => CSV_COLUMNS
            .map(column => escapeCsv(formatCsvValue(row[column.key], column)))
            .join(','))
    ].join('\n');
}

function formatDisplayValue(value: any, column: SummaryColumn): string | number {
    const formatted = formatCsvValue(value, column);
    return column.displayUnit && formatted !== '' ? `${formatted} ${column.displayUnit}` : formatted;
}

function formatCsvValue(value: any, column: SummaryColumn): string | number {
    if (value == null || value === '') {
        return '';
    }
    if (typeof value === 'number' && column.decimals != null) {
        if (!Number.isFinite(value)) {
            return '';
        }
        const factor = 10 ** column.decimals;
        return Math.round(value * factor) / factor;
    }
    return value;
}

function escapeCsv(value: string | number): string {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
