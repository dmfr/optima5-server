Ext.define('Optima5.Modules.Spec.RsiRecouveo.AgreeComparePanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			defaults: {
				//bodyPadding: 10,
			},
			items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel',{
				flex: 1,
				readOnly: true,
				
				itemId: 'summaryBefore',
				//title: 'Echeancier',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 10,
				
				altTitle: 'Echéancier original',
				
				optimaModule: this.optimaModule
			}),Ext.create('Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel',{
				flex: 1,
				readOnly: true,
				
				itemId: 'summaryAfter',
				//title: 'Echeancier',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 10,
				
				altTitle: 'Echéancier actualisé',
				
				optimaModule: this.optimaModule
			})]
		}) ;
		this.callParent() ;
		if( this._fileFilerecordId ) {
			this.setupFromFile( this._fileFilerecordId ) ;
		}
	},
	setupFromFile: function(fileFilerecordId) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_fileFilerecordId_arr: Ext.JSON.encode([fileFilerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadFile(
					Ext.ux.dams.ModelManager.create( 
						Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel(),
						ajaxResponse.data[0]
					)
				) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadFile: function(fileRecord) {
		if( !Ext.isEmpty(fileRecord.get('from_params_json')) ) {
			this.down('#summaryBefore').setupFromParams(fileRecord.getData(), Ext.JSON.decode(fileRecord.get('from_params_json'))) ;
		}
		this.down('#summaryAfter').setupFromFile(fileRecord) ;
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
			msg: RsiRecouveoLoadMsg.loadMsg
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
