Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [],
			buttons: [{
				itemId: 'btnOk',
				hidden: true,
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					console.dir( this.getForm().getValues(false,false,false,true) ) ;
					this.handleSubmitEvent() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.startAction( this._fileFilerecordId, this._fileActionFilerecordId, this._newActionCode ) ;
		},this) ;
	},
	
	startAction: function( fileFilerecordId, fileActionFilerecordId, newActionCode ) {
		this._fileFilerecordId = fileFilerecordId ;
		this._fileActionFilerecordId = fileActionFilerecordId ;
		this._newActionCode = newActionCode ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_fileFilerecordId_arr: Ext.JSON.encode([this._fileFilerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onStartResponse(Ext.ux.dams.ModelManager.create(
					Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel()
					,ajaxResponse.data[0])
				) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onStartResponse: function( fileRecord ) {
		console.dir(fileRecord) ;
		this._fileRecord = fileRecord ;
		
		
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',{
			border: false,
			
			optimaModule: this.optimaModule,
			_fileRecord: this._fileRecord
		})) ;
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',{
			border: false,
			
			optimaModule: this.optimaModule,
			_fileRecord: this._fileRecord
		})) ;
		this.down('#btnOk').setVisible(true) ;
		this.fireEvent('mylayout',this) ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
	
	
	
	
	
}) ;
