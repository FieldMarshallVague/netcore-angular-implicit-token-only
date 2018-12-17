﻿import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class OidcSecuritySilentRenew {
    private sessionIframe: any;

    constructor(private loggerService: LoggerService) {}

    initRenew() {
        let existsparent = undefined;
        try {
            const parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }

            existsparent = parentdoc.getElementById('myiFrameForSilentRenew');
        } catch (e) {
            // not accessible
        }
        const exists = window.document.getElementById('myiFrameForSilentRenew');
        if (existsparent) {
            this.sessionIframe = existsparent;
        } else if (exists) {
            this.sessionIframe = exists;
        }

        if (!exists && !existsparent) {
            this.sessionIframe = window.document.createElement('iframe');
            this.sessionIframe.id = 'myiFrameForSilentRenew';
            this.loggerService.logDebug(this.sessionIframe);
            this.sessionIframe.style.display = 'none';

            window.document.body.appendChild(this.sessionIframe);
        }
    }

    startRenew(url: string): Observable<any> {
        let existsparent = undefined;
        try {
            const parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }

            existsparent = parentdoc.getElementById('myiFrameForSilentRenew');
        } catch (e) {
            // not accessible
        }
        const exists = window.document.getElementById('myiFrameForSilentRenew');
        if (existsparent) {
            this.sessionIframe = existsparent;
        } else if (exists) {
            this.sessionIframe = exists;
        }

        this.loggerService.logDebug('startRenew for URL:' + url);
        this.sessionIframe.src = url;

        return Observable.create((observer: Observer<any>) => {
            this.sessionIframe.onload = () => {
                observer.next(this);
                observer.complete();
            };
        });
    }
}
