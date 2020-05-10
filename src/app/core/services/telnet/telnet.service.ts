import { Injectable } from '@angular/core';

import telnet_client from 'telnet-client';
import { ElectronService } from '../electron/electron.service';
import { DetailService } from '../../../detail/detail.service';

@Injectable({
  providedIn: 'root'
})
export class TelnetServise
{
  private _telnet: typeof telnet_client;
  private _conn: any;

  private _params = {
    host: '192.168.1.1',
    port: 23,
    username: 'rootuser',
    password: '77553311',
    timeout: 10000
  };

  constructor(
    private electron: ElectronService,
    private detailService: DetailService
  ) { 
    this._init();
  }

  public async setGponSnToHtwcSn(): Promise<void>
  {
    await this._connectToONU();
    await this._setVendorIdToHWTC();
    const sn = await this._getSNAndType();

    if (sn.type !== 'GPON')
    {
      const str = 'Error >>> This ONU is already at HTWC mode.';
      this.detailService.append(str);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: 'This ONU is already at HTWC mode.' 
      });
      throw new Error(str);
    }

    await this._setSN(sn);
    await this._setDefaultCS();
    await this._reboot();
    await this._connEnd();
  }

  public async setHwtcSnToGponSn(): Promise<void>
  {
    await this._connectToONU();
    await this._setVendorIdToHWTC();
    const sn = await this._getSNAndType();

    if (sn.type !== 'HWTC')
    {
      const str = 'Error >>> This ONU is already at GPON mode.';
      this.detailService.append(str);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: 'This ONU is already at GPON mode.' 
      });
      throw new Error(str);
    }

    await this._setSN(sn);
    await this._setDefaultCS();
    await this._reboot();
    await this._connEnd();
  }

  public async getCurrentMode(): Promise<string>
  {
    await this._connectToONU();
    const sn = await this._getSNAndType();
    await this._connEnd();

    return sn.type;
  }

  private _init(): void
  {
    this._telnet = this.electron.telnet;

    const str1 = 'Initial Telnet instance start ...';
    console.log(str1);
    this.detailService.append(str1);

    try
    {
      this._conn = new this._telnet();
    }
    catch (err)
    {
      console.log('Please anable Telnet on this machine !!');
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: 'Please anable Telnet on this machine !!' 
      });
      this.detailService.append('Please anable Telnet on this machine !!');
    }

    const str2 = 'Initial Telnet instance finished ...';
    console.log(str2);
    this.detailService.append(str2);
  }

  private async _connectToONU(): Promise<void>
  {
    try 
    {
      const str1 = 'Connecting to the ONU via Telnet <username> <password> ...';
      console.log(str1);
      this.detailService.append(str1);
      const res = await this._conn.connect(this._params);
      console.log('>>>', res);
      this.detailService.append(`>>> ${res}`);
    }
    catch (err)
    {
      const str = 'Connecting to the ONU fail, check if the ONU is on !!';
      this.detailService.append(str);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: str 
      });
      throw new Error(str);
    }
  }

  private async _setVendorIdToHWTC(): Promise<void>
  {
    try
    {
      console.log('#', 'flash set PON_VENDOR_ID HWTC');
      this.detailService.append('#flash set PON_VENDOR_ID HWTC');

      const res = await this._conn.exec('flash set PON_VENDOR_ID HWTC');
      console.log('>>>', res);
      this.detailService.append(`>>> ${res}`);
    } 
    catch (err)
    {
      this.detailService.append(err);
      console.log(err);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: err 
      });
    }
  }

  private async _getSNAndType(): Promise<SNType>
  {
    try
    {
      console.log('#', 'flash get GPON_SN');
      this.detailService.append('#flash get GPON_SN');

      const res = await this._conn.exec('flash get GPON_SN');
      const resTrim = res.trim();

      console.log('>>>', resTrim);
      this.detailService.append(`>>> ${resTrim}`);

      const [_, sn] = resTrim.split('=');

      if (sn.indexOf('HWTC') > -1)   // 已经更改成HWTC了
      {
        return {
          sn: sn.split('HWTC')[1],
          type: 'HWTC',
          toType: 'GPON'
        }
      }
      
      return {
        sn: sn.split('GPON')[1],
        type: 'GPON',
        toType: 'HWTC'
      }
    }
    catch (err)
    {
      this.detailService.append(err);
      console.log(err);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: err 
      });
    }
  }

  private async _setSN(sn: SNType): Promise<void>
  {
    try
    {
      console.log('#', `flash set GPON_SN ${sn.toType}${sn.sn}`);
      this.detailService.append(`#flash set GPON_SN ${sn.toType}${sn.sn}`);

      const res = await this._conn.exec(`flash set GPON_SN ${sn.toType}${sn.sn}`);

      console.log('>>>', res);
      this.detailService.append(`>>> ${res}`);
    }
    catch (err)
    {
      console.log(err);
      this.detailService.append(err);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: err 
      });
    }
  }

  private async _setDefaultCS(): Promise<void>
  {
    try
    {
      console.log('#', 'flash default cs');
      this.detailService.append('#flash default cs');

      const res = await this._conn.exec('flash default cs');

      console.log('>>>', res);
      this.detailService.append(`>>> ${res}`);
    }
    catch (err)
    {
      console.log(err);
      this.detailService.append(err);
      this.electron.remote.dialog.showMessageBox(null, { 
        type: 'error', 
        title: 'Error',
        message: err 
      });
    }
  }

  private async _reboot(): Promise<void>
  {
    try
    {
      console.log('#', 'reboot -f');
      this.detailService.append('#reboot -f');

      const res = await this._conn.exec('reboot -f');

      console.log('>>>', res);
      this.detailService.append(`>>> ${res}`);
    }
    catch (err)
    {
      // 设备重启了, 所以会有没回应的错误, 这里忽略掉算了.. 
      // console.log(err);
    }
  }

  private async _connEnd(): Promise<void>
  {
    console.log('Connection end start ...');
    this.detailService.append('Connection end start ...');

    await this._conn.end();

    console.log('Connection end finished ...');
    this.detailService.append('Connection end finished ...');
  }
}

export interface SNType
{
  sn: string;
  type: 'GPON' | 'HWTC',
  toType: 'GPON' | 'HWTC'
}