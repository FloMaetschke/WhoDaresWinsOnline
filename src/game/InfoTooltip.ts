export class InfoTooltip {
    private tooltip: HTMLElement | null = null;
    private tooltipId: string;

    constructor(tooltipId: string = 'game-info-tooltip') {
        this.tooltipId = tooltipId;
        this.createTooltip();
    }

    /**
     * Erstellt das Tooltip-Element oder entfernt existierende
     */
    private createTooltip(): void {
        // Prüfen, ob bereits ein Tooltip mit derselben ID existiert und diesen entfernen
        const existingTooltip = document.getElementById(this.tooltipId);
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // Tooltip erstellen
        this.tooltip = document.createElement('div');
        this.tooltip.id = this.tooltipId;
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.padding = '8px';
        this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.tooltip.style.color = 'white';
        this.tooltip.style.borderRadius = '4px';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.zIndex = '1000';
        this.tooltip.style.display = 'none';
        this.tooltip.style.fontFamily = 'Arial, sans-serif';
        this.tooltip.style.fontSize = '12px';
        this.tooltip.style.lineHeight = '1.4';
        this.tooltip.style.whiteSpace = 'nowrap';
        document.body.appendChild(this.tooltip);
    }

    /**
     * Aktualisiert den Inhalt und die Position des Tooltips
     */
    public update(content: string, x: number, y: number): void {
        if (this.tooltip) {
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = `${x + 15}px`;
            this.tooltip.style.top = `${y + 15}px`;
            this.tooltip.innerHTML = content.replace(/\n/g, '<br>');
        }
    }

    /**
     * Versteckt das Tooltip
     */
    public hide(): void {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    /**
     * Entfernt das Tooltip aus dem DOM
     */
    public destroy(): void {
        if (this.tooltip && document.body.contains(this.tooltip)) {
            document.body.removeChild(this.tooltip);
            this.tooltip = null;
        }
    }
}
