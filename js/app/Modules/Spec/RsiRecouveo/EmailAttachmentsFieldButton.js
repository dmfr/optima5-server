
Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldButton',{
	extend:'Ext.button.Button',
	
	mixins: ['Ext.form.field.Field'],
	
	panelWidth: 300,
	panelHeight: 300,
	
	initComponent: function() {
		Ext.apply(this,{
			scale: 'medium',
			icon: 'images/modules/rsiveo-attachment-22.png',
			text: '&#160;',
			listeners: {
				click: function() {
					this.toggleWindow() ;
				},
				scope: this
			}
		}) ;
		
		this.attachmentsStore = Ext.create('Ext.data.Store', {
			fields: ['name', 'size', 'file', 'status','tmpMediaId'],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		});
		this.attachmentsStore.on('datachanged', function(store) {
			var storeCount = store.getCount() ;
			this.updateBtnText(storeCount) ;
		},this) ;
		
		this.callParent() ;
		this.updateBtnText(0) ;
		this.on('destroy',this.onDestroyMyself,this) ;
	},
	updateBtnText: function(storeCount) {
		if( storeCount > 0 ) {
			this.setText('<font color="white"><b>('+storeCount+')</b></font>') ;
		} else {
			this.setText('<font color="#C2C2C2"><b>(0)</b></font>') ;
		}
	},
	toggleWindow: function() {
		if( !this.floatingWindow ) {
			this.floatingWindow = this.getWindowObject() ;
		}
		if( !this.floatingWindow.isVisible() ) {
			this.floatingWindow.showBy(this.el, 'tr-br?') ;
		} else {
			this.floatingWindow.hide() ;
		}
	},
	getWindowObject: function() {
		var me = this ;
		return Ext.create('Ext.window.Window',{
			width: this.panelWidth,
			height: this.panelHeight,
			
			closeAction: 'hide',
			header: false,
			hidden: true,
			renderTo: this.renderTarget,
			constrain: true,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'form',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 2,
				defaults: {
						anchor: '100%',
						allowBlank: false,
						msgTarget: 'side',
						labelWidth: 50
				},
				//bodyPadding: '0 0 0 0',
				items: [{
					xtype: 'filefield',
					emptyText: 'Selectionner fichier',
					name: 'uploadfile',
					buttonText: '',
					buttonConfig: {
						iconCls: 'upload-icon'
					},
					listeners: {
						change: {
							fn: function(field) {
								var form = field.up('form') ;
								this.doUploadManual(form) ;
							},
							scope:this
						}
					}
				}]
			},{
				flex: 1,
				xtype: 'grid',
				columns: [{
					header: 'Name',
					dataIndex: 'name',
					flex: 1
				}, {
					width:24,
					header: '',
					dataIndex: 'status',
					renderer: function(value, metaData, record) {
						switch( value ) {
							case "Ready" :
								metaData.tdCls += ' op5-spec-rsiveo-kpi-unknown' ;
								break ;
							case "Uploading" :
								metaData.tdCls += ' op5-spec-rsiveo-kpi-uploading' ;
								break ;
							case "Error" :
								metaData.tdCls += ' op5-spec-rsiveo-kpi-nok' ;
								break ;
							case "Uploaded" :
								metaData.tdCls += ' op5-spec-rsiveo-kpi-ok' ;
								break ;
						}
					}
				}, {
					align: 'center',
					xtype:'actioncolumn',
					width:24,
					disabledCls: 'x-item-invisible',
					items: [{
						icon: 'images/op5img/ico_delete_16.gif',
						tooltip: 'Effacer',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleDelete(grid.getStore(),rowIndex) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(grid,rowIndex,colIndex,item,record ) {
							var rec = grid.getStore().getAt(rowIndex);
							if( rec.get('status')=='Uploaded' && !Ext.isEmpty(rec.get('tmpMediaId')) ) {
								return false ;
							}
							return true ;
						}
					}]
				}],

				viewConfig: {
					emptyText: 'Drop Files Here',
					deferEmptyText: false
				},
				store: this.attachmentsStore,

				listeners: {

					drop: {
						element: 'el',
						fn: 'drop'
					},

					dragstart: {
						element: 'el',
						fn: 'addDropZone'
					},

					dragenter: {
						element: 'el',
						fn: 'addDropZone'
					},

					dragover: {
						element: 'el',
						fn: 'addDropZone'
					},

					dragleave: {
						element: 'el',
						fn: 'removeDropZone'
					},

					dragexit: {
						element: 'el',
						fn: 'removeDropZone'
					},
				},

				noop: function(e) {
					e.stopEvent();
				},

				addDropZone: function(e) {
					if (!e.browserEvent.dataTransfer || Ext.Array.from(e.browserEvent.dataTransfer.types).indexOf('Files') === -1) {
						return;
					}

					e.stopEvent();

					this.addCls('drag-over');
				},

				removeDropZone: function(e) {
					var el = e.getTarget(),
						thisEl = this.getEl();

					e.stopEvent();


					if (el === thisEl.dom) {
						this.removeCls('drag-over');
						return;
					}

					while (el !== thisEl.dom && el && el.parentNode) {
						el = el.parentNode;
					}

					if (el !== thisEl.dom) {
						this.removeCls('drag-over');
					}

				},

				drop: function(e) {
					e.stopEvent();
					Ext.Array.forEach(Ext.Array.from(e.browserEvent.dataTransfer.files), function(file) {
						
						var newRecords = me.attachmentsStore.add({
								file: file,
								name: file.name,
								size: file.size,
								status: 'Ready'
						});
						var newRecord = newRecords[0] ;
						var newRecordIdx = me.attachmentsStore.indexOf(newRecord) ;
						Ext.defer(function() {
							newRecord.set('status',"Uploading") ;
							newRecord.commit() ;
							
							me.doUpload(me.attachmentsStore, newRecordIdx) ;
						},1000,me) ;
					});
					
				},
			}] 
		});
	},
	doUpload: function(store, i) {

		var fd = new FormData();
		Ext.Object.each( this.optimaModule.getConfiguredAjaxParams(), function(k,v) {
				fd.append(k,v) ;
		} ) ;

		fd.append("_moduleId",'spec_rsi_recouveo');
		fd.append("_action",'mail_uploadEmailAttachment');


		fd.append('file', store.getData().getAt(i).data.file);

		var xhr = new XMLHttpRequest();
		
		xhr.open("POST", Optima5.Helper.getApplication().desktopGetBackendUrl(), true);
		
		

		xhr.setRequestHeader("serverTimeDiff", 0);

		xhr.onreadystatechange = function() {

			if (xhr.readyState == 4 && xhr.status == 200) {

	
				//handle the answer, in order to detect any server side error
				if (Ext.decode(xhr.responseText).success) {

					store.getData().getAt(i).data.status = "Uploaded";
					store.getData().getAt(i).data.tmpMediaId = Ext.decode(xhr.responseText).data.media_id;
				} else {
					store.getData().getAt(i).data.status = "Error";

				}
				store.getData().getAt(i).commit();
			} else if (xhr.readyState == 4 && xhr.status == 404) {

				store.getData().getAt(i).data.status = "Error";
				store.getData().getAt(i).commit();
			}
		};
		
		// Initiate a multipart/form-data upload
		xhr.send(fd);

	},
	doUploadManual: function(form) {
		var store = this.attachmentsStore ;
		if(form.isValid()){
			var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_uploadEmailAttachment'
			}) ;
			var msgbox = Ext.Msg.wait('Uploading document...');
			form.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					store.add({
							file: ajaxData.path,
							name: ajaxData.filename,
							size: ajaxData.size,
							status: 'Uploaded',
							tmpMediaId: ajaxData.media_id
					});
				},
				failure: function(form, action) {
					msgbox.close() ;
					var msg = 'Erreur' ;
					if( action.response.responseText ) {
							msg = Ext.JSON.decode(action.response.responseText).error ;
					}
					Ext.Msg.alert('Erreur',msg) ;
				},
				scope: this
			});
		}
	},
	 handleDelete: function(store,i) {
		 var record = store.getAt(i),
			  tmpMediaId = record.get('tmpMediaId') ;
		 
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_deleteTmpMedia',
				arr_media_id: Ext.JSON.encode([tmpMediaId])
			},
			scope: this
		});
		 
		 store.remove(record) ;
	 },
	 onDestroyMyself: function(myself) {
		var tmpMediaIds = [] ;
		this.attachmentsStore.each( function(rec) {
			if( !Ext.isEmpty(rec.get('tmpMediaId')) ) {
				tmpMediaIds.push( rec.get('tmpMediaId') ) ;
			}
		}) ;
		if( tmpMediaIds.length == 0 ) {
			return ;
		}
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_deleteTmpMedia',
				arr_media_id: Ext.JSON.encode(tmpMediaIds)
			},
			scope: this
		});
		
		if( this.floatingWindow ) {
			this.floatingWindow.destroy() ;
		}
	},
	getValue: function() {
		var store = this.attachmentsStore;
		var mediaLst = [] ;
		store.each(function(storeRecord) {
			mediaLst.push( storeRecord.getData() ) ;
		}) ;
		return mediaLst ;
	},
	getSubmitData: function() {
		var retObj = {} ;
		retObj[this.getName()] = Ext.JSON.encode(this.getValue()) ;
		return retObj ;
	},
	
	
	doImportFromReuse: function( emailFilerecordId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_uploadReuseAttachments',
				email_filerecord_id: emailFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || !ajaxResponse.data ) {
					return ;
				}
				var store = this.attachmentsStore ;
				Ext.Array.each( ajaxResponse.data, function(attachRow) {
					store.add({
						file: attachRow.path,
						name: attachRow.filename,
						size: attachRow.size,
						status: 'Uploaded',
						tmpMediaId: attachRow.media_id
					});
				}) ;
			},
			scope: this
		});
	}
}) ;
