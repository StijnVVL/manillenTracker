import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddTeamDialogService, TeamDialogResult } from '../../services/add-team-dialog.service';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { Team } from '../../models/tournament.model';

@Component({
  selector: 'app-team-list-editor',
  standalone: true,
  imports: [CommonModule, L10nPipe, SvgIconComponent],
  templateUrl: './team-list-editor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './team-list-editor.component.css',
})
export class TeamListEditorComponent {
  @Input() teams: Team[] = [];
  /** When true, presence check-in buttons and counter are shown (tournament state only). */
  @Input() showPresence = false;
  /** When true, all mutating actions (add, edit, remove, presence) are hidden. */
  @Input() readonly = false;
  /** When true, missing-info tags use orange (warning) styling instead of red (danger). */
  @Input() settingsMode = false;
  /** When false, the counters row is hidden (e.g. after tournament has started). */
  @Input() showCounters = true;

  get presentCount(): number {
    if (!this.showPresence) return 0;
    return this.teams.filter(t => t.present).length;
  }

  get fullInfoCount(): number {
    return this.teams.filter(t => !this.isMissingInfo(t)).length;
  }

  get presenceIsFull(): boolean {
    return this.showPresence && this.presentCount === this.teams.length;
  }

  get infoIsFull(): boolean {
    return this.fullInfoCount === this.teams.length;
  }

  @Output() teamAdded = new EventEmitter<TeamDialogResult>();
  @Output() teamEdited = new EventEmitter<{ teamId: string } & TeamDialogResult>();
  @Output() teamRemoved = new EventEmitter<string>();
  @Output() teamPresent = new EventEmitter<string>();
  @Output() teamAbsent = new EventEmitter<string>();
  @Output() startTournament = new EventEmitter<void>();

  /** When true, shows a "Start Tournament" button in the actions bar (disabled when startDisabled). */
  @Input() showStartButton = false;
  @Input() startDisabled = false;

  constructor(
    private addTeamDialogService: AddTeamDialogService,
    private confirmDialogService: ConfirmDialogService,
    private elementRef: ElementRef<HTMLElement>,
    public l10n: L10nService
  ) {}

  /** Id of the team that was just added; its row gets a short highlight. */
  highlightedTeamId: string | null = null;

  isPresent(team: Team): boolean {
    return this.showPresence && !!team.present;
  }

  isMissingInfo(team: Team): boolean {
    return !team.name?.trim() || !team.player1?.trim() || !team.player2?.trim();
  }

  async confirmStartTournament(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.startTournament.title'),
      message: this.l10n.get('dialog.startTournament.message'),
      confirmText: this.l10n.get('dialog.startTournament.confirm'),
      cancelText: this.l10n.get('common.cancel'),
    });
    if (confirmed) this.startTournament.emit();
  }

  async openAddTeamDialog(): Promise<void> {
    const existingNames = this.teams.map(t => t.name);
    const result = await this.addTeamDialogService.openAdd(this.showPresence, existingNames);
    if (result) {
      const knownIds = new Set(this.teams.map(t => t.id));
      this.teamAdded.emit(result);
      setTimeout(() => this.highlightNewTeam(knownIds));
    }
  }

  private highlightNewTeam(knownIds: Set<string>): void {
    const added = this.teams.find(t => !knownIds.has(t.id));
    if (!added) return;
    this.highlightedTeamId = added.id;
    setTimeout(() => {
      const row = this.elementRef.nativeElement.querySelector<HTMLElement>(`[data-team-id="${added.id}"]`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    setTimeout(() => {
      if (this.highlightedTeamId === added.id) this.highlightedTeamId = null;
    }, 500);
  }

  async openEditTeamDialog(team: Team): Promise<void> {
    const existingNames = this.teams.filter(t => t.id !== team.id).map(t => t.name);
    const result = await this.addTeamDialogService.openEdit(team, existingNames);
    if (result) this.teamEdited.emit({ teamId: team.id, ...result });
  }

  async confirmRemoveTeam(team: Team): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.removeTeam.title'),
      message: this.l10n.get('dialog.removeTeam.message', { teamName: team.name }),
      confirmText: this.l10n.get('dialog.removeTeam.confirm'),
      cancelText: this.l10n.get('common.cancel'),
    });
    if (confirmed) this.teamRemoved.emit(team.id);
  }

  async confirmMarkPresent(team: Team): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.markPresent.title'),
      message: this.l10n.get('dialog.markPresent.message', { teamName: team.name }),
      confirmText: this.l10n.get('dialog.markPresent.confirm'),
      cancelText: this.l10n.get('common.cancel'),
    });
    if (confirmed) this.teamPresent.emit(team.id);
  }

  async confirmMarkAbsent(team: Team): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.markAbsent.title'),
      message: this.l10n.get('dialog.markAbsent.message', { teamName: team.name }),
      confirmText: this.l10n.get('dialog.markAbsent.confirm'),
      cancelText: this.l10n.get('common.cancel'),
    });
    if (confirmed) this.teamAbsent.emit(team.id);
  }
}
