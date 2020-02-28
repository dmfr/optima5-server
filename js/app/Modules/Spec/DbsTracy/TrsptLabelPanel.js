Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptLabelJsonCmp',{
	extend: 'Ext.Component',
	scrollable: true,
	tpl: [
		'<div class="op5-spec-dbstracy-jsoncmp"><pre>{[this.escapeJson(values.json_txt)]}</pre></div>',
		{
			// XTemplate configuration:
			disableFormats: true,
			
			// member functions:
			escapeJson: function(jsonTxt){
				if( Ext.isString(jsonTxt) ) {
					return Ext.String.htmlEncode(jsonTxt.trim()) ;
				}
				return '&#160;' ;
			}
		}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptLabelPanel',{
	extend:'Ext.panel.Panel',
	
	_trsptFilerecordId: null,
	_trspteventFilerecordId: null,
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'box',
				cls:'op5-waiting'
			}]
		});
		this.callParent() ;
	},
	loadFromTrsptEvent: function(trsptFilerecordId, trspteventFilerecordId) {
		this._trsptFilerecordId = null ;
		this._trspteventFilerecordId = null ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_getLabelTMS',
				trspt_filerecord_id: trsptFilerecordId,
				trsptevent_filerecord_id: trspteventFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( !ajaxResponse.success ) {
					this.destroy() ;
					return ;
				}
				this.onLoadLabelData(ajaxResponse.data) ;
			},
			callback: function() {},
			scope: this
		}) ;
	},
	onLoadLabelData: function( labelData ) {
		if( labelData.label_data ) {
			this._trsptFilerecordId = labelData.label_data.trspt_filerecord_id ;
			this._trspteventFilerecordId = labelData.label_data.trsptevent_filerecord_id ;
		}
		
		this.removeAll() ;
		this.add({
			flex: 1,
			xtype: 'panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			tbar: [{
				icon: 'images/op5img/ico_print_16.png',
				text: 'Print',
				handler: null,
				menu: {
					items:[{
						xtype:'textfield' ,
						width:150
					},{
						xtype:'button',
						text:'Print To IP/Host',
						handler: function(button){
							var textfield = button.up('menu').query('textfield')[0],
								textValue = textfield.getValue() ;
							this.handlePrintTo( textValue ) ;
							Ext.menu.Manager.hideAll();
						},
						scope:this
					}]
				}
			},{
				_trspteventFilerecordId: (labelData.label_data ? labelData.label_data.trsptevent_filerecord_id : null),
				_binaryBase64: labelData.label_png_base64,
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Save as PNG',
				handler: function(btn) {
					this.createAndDownloadBlobFile( this.base64ToArrayBuffer(btn._binaryBase64), 'label-'+btn._trspteventFilerecordId+'.png' ) ;
				},
				scope: this
			},'->',{
				_rotateStatus: false,
				icon: 'images/modules/crmbase-viewrefresh-16.png',
				text: 'Rotate',
				handler: function(btn) {
					btn._rotateStatus = !btn._rotateStatus ;
					this.down('#imgLabelPreview')[btn._rotateStatus ? 'addCls': 'removeCls']('op5-spec-dbstracy-trsptlabelpreview-rotate') ;
				},
				scope: this
			}],
			items: [{
				xtype: 'form',
				hidden: Ext.isEmpty(labelData.label_data),
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 8,
				layout: 'anchor',
				fieldDefaults: {
					labelWidth: 100,
					anchor: '100%'
				},
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Date create',
					fieldStyle: 'font-weight: bold',
					value: (labelData.label_data ? labelData.label_data.date_create : null)
				},{
					xtype: 'displayfield',
					fieldLabel: 'Tracking #',
					fieldStyle: 'font-weight: bold',
					fieldBodyCls: ((labelData.label_data && !labelData.label_data.is_printable) ? 'op5-spec-dbstracy-field-strike' : ''),
					value: (labelData.label_data ? labelData.label_data.tracking_no : null)
				}]
			},{
				flex: 1,
				xtype: 'tabpanel',
				items: [{
					title: 'Request',
					xtype: 'panel',
					layout: 'fit',
					items: Ext.create('Optima5.Modules.Spec.DbsTracy.TrsptLabelJsonCmp',{
						data: {
							json_txt: labelData.json_request
						}
					})
				},{
					title: 'Response',
					xtype: 'panel',
					layout: 'fit',
					items: Ext.create('Optima5.Modules.Spec.DbsTracy.TrsptLabelJsonCmp',{
						data: {
							json_txt: labelData.json_response
						}
					})
				}]
			}]
		},{
			flex: 1,
			xtype:'panel',
			layout: 'fit',
			items: [{
				hidden: !Ext.isEmpty(labelData.label_png_base64),
				xtype: 'box',
				cls: 'ux-noframe-bg',
				html: '<div style="display:table; width: 100%; height: 100%">'
						+'<div style="display: table-cell; text-align: center; vertical-align: middle">'
							+'<i>No preview available></i>'
						+'</div>'
					+'</div>'
			},{
				hidden: Ext.isEmpty(labelData.label_png_base64),
				xtype: 'container',
				scrollable: true,
				items: [{
					itemId: 'imgLabelPreview',
					xtype: 'image',
					style: 'width: 100%;',
					src: 'data:image/jpeg;base64,' + labelData.label_png_base64
				}]
			}]
		});
	},
	
	base64ToArrayBuffer: function(base64) {
		var binary_string = window.atob(base64);
		var len = binary_string.length;
		var bytes = new Uint8Array(len);
		for (var i = 0; i < len; i++) {
			bytes[i] = binary_string.charCodeAt(i);
		}
		return bytes.buffer;
	},
	createAndDownloadBlobFile: function(body, filename ) {
		var blob = new Blob([body]);
		//var fileName = `${filename}.${extension}`;
		if (navigator.msSaveBlob) {
			// IE 10+
			navigator.msSaveBlob(blob, filename);
		} else {
			var link = document.createElement('a');
			// Browsers that support HTML5 download attribute
			if (link.download !== undefined) {
				var url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', filename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}
	},
	
	//10.204.204.112
	handlePrintTo: function( printerStr ) {
		if( this._labelMessageBox ) {
			this._labelMessageBox.close() ;
			this._labelMessageBox = null ;
		}
		printerStr = printerStr || '' ;
		if( Ext.isEmpty(printerStr.trim()) ) {
			return ;
		}
		this._labelMessageBox = Ext.Msg.wait('Printing label on <b>'+printerStr+'</b>...')
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_printTMS',
				trspt_filerecord_id: this._trsptFilerecordId,
				trsptevent_filerecord_id: this._trspteventFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( !ajaxResponse.success ) {
					var strErr = 'TMS reported error:<br>'+ajaxResponse.error ;
					Ext.defer(function(){Ext.MessageBox.alert('Error',strErr);},100) ;
				}
			},
			callback: function() {
				if( this._labelMessageBox ) {
					this._labelMessageBox.close() ;
					this._labelMessageBox = null ;
				}
			},
			scope: this
		}) ;
	},
	
	dummyFn: function() {}
}) ;
