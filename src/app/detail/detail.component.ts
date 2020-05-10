import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { TelnetServise, ElectronService } from '../core/services';
import { DetailService } from './detail.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy
{
  private outputsSub: Subscription;

  currentMode: string;
  outputs = '';
  isLoading$: BehaviorSubject<boolean>;

  @ViewChild('content') content: ElementRef;

  constructor(
    private telnet: TelnetServise,
    public detailService: DetailService,
    private electron: ElectronService
  ) { }

  ngOnInit(): void 
  { 
    this.isLoading$ = new BehaviorSubject<boolean>(false);

    this.outputsSub = this.detailService.output$
      .pipe(
        filter(output => !!output)
      )
      .subscribe(output =>
      {
        this.outputs = `${this.outputs} \n${output}`;
        this._scrollToBottom();
      });
  }

  ngOnDestroy(): void
  {
    if (this.outputsSub)
    {
      this.outputsSub.unsubscribe();
    }
    this.detailService.clear();
  }

  async changeToHuaweiMode(): Promise<void>
  {
    this.isLoading$.next(true);
    await this.telnet.setGponSnToHtwcSn();
    this.currentMode = '...';
    this.electron.remote.dialog.showMessageBox(null, { 
      type: 'info', 
      title: 'Success',
      message: 'Successful change to HUAWEI mode.' 
    });
    this.isLoading$.next(false);
  }

  async changeToDefaultMode(): Promise<void>
  {
    this.isLoading$.next(true);
    await this.telnet.setHwtcSnToGponSn();
    this.currentMode = '...';
    this.electron.remote.dialog.showMessageBox(null, { 
      type: 'info', 
      title: 'Success',
      message: 'Successful change to DEFAULT mode.' 
    });
    this.isLoading$.next(false);
  }

  async getCurrentMode(): Promise<void>
  {
    this.isLoading$.next(true);
    this.currentMode = await this.telnet.getCurrentMode() === 'GPON' ? 'DEFAULT' : 'HUAWEI';
    this.electron.remote.dialog.showMessageBox(null, { 
      type: 'info', 
      title: 'Success',
      message: `Current mode is: ${this.currentMode}`
    });
    this.isLoading$.next(false);
  }

  private _scrollToBottom() {
    try 
    {
      this.content.nativeElement.scrollTop = this.content.nativeElement.scrollHeight;
    } 
    catch (err) { }
  }

}
