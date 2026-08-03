import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
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
  /** When non-null, presence check-in buttons are shown. */
  @Input() teamPresence: Record<string, boolean> | null = null;
  /** When true, all mutating actions (add, edit, remove, presence) are hidden. */
  @Input() readonly = false;
  /** When true, missing-info tags use orange (warning) styling instead of red (danger). */
  @Input() settingsMode = false;

  get presentCount(): number {
    if (!this.teamPresence) return 0;
    return Object.values(this.teamPresence).filter(Boolean).length;
  }

  get fullInfoCount(): number {
    return this.teams.filter(t => !this.isMissingInfo(t)).length;
  }

  get presenceIsFull(): boolean {
    return this.teamPresence !== null && this.presentCount === this.teams.length;
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
    public l10n: L10nService
  ) {}

  isPresent(team: Team): boolean {
    return this.teamPresence !== null && !!this.teamPresence[team.id];
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
    const result = await this.addTeamDialogService.openAdd(this.teamPresence !== null);
    if (result) this.teamAdded.emit(result);
  }

  async openEditTeamDialog(team: Team): Promise<void> {
    const result = await this.addTeamDialogService.openEdit(team);
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
