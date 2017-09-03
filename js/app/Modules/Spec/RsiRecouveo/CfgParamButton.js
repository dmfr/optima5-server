Ext.define('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton' ,{
	extend: 'Ext.button.Button',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.CfgParamTree'],
	
	selectMode: 'SINGLE',
	
	initComponent: function() {
		var cfgParamTree = Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamTree',{
			optimaModule: this.optimaModule,
			cfgParam_id: this.cfgParam_id,
			selectMode: this.selectMode, // SINGLE / MULTI
			width:250,
			height:300,
			listeners: {
				change: {
					fn: function(){
						this.onChange() ;
					},
					scope: this
				},
				load: {
					fn: this.onAfterLoad,
					scope: this
				}
			},
			value: this.value
		});
		Ext.apply(this,{
			menu: {
				xtype:'menu',
				items:[cfgParamTree]
			}
		});
		
		//this.text = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(this.cfgParam_id).atr_txt ;
		this.text = cfgParamTree.getRootNode().get('nodeText') ;
		this.baseText = this.text ;
		this.setText(this.baseText) ;
		
		this.callParent() ;
		this.onChange(true) ;
	},
	onChange: function(silent) {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getValue() ;
		if( Ext.isEmpty(selectedValue) ) {
			this.removeCls( 'op5-spec-dbspeople-cfgparambtn-bold' ) ;
			this.setText( this.baseText ) ;
		} else {
			this.addCls( 'op5-spec-dbspeople-cfgparambtn-bold' ) ;
			if( this.selectMode == 'MULTI' && selectedValue.length > 1 ) {
				var vals = [] ;
				Ext.Array.each( selectedValue, function(val) {
					vals.push( val ) ;
				});
				this.setText( vals.join('&#160;'+'/'+'&#160;') ) ;
			} else {
				var val = ( this.selectMode == 'MULTI' ? selectedValue[0] : selectedValue ),
					rec = cfgParamTree.getStore().getNodeById(val) ;
				if( rec ) {
					this.setText( rec.get('nodeText') ) ;
				} else {
					this.setText( val ) ;
				}
			}
		}
		
		if( !silent ) {
			this.fireEvent('change',selectedValue) ;
		}
	},
	getValue: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getValue() ;
		return selectedValue ;
	},
	getLeafNodesKey: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			retValue = cfgParamTree.getLeafNodesKey() ;
		return retValue ;
	},
	
	setValue: function(value) {
		var cfgParamTree = this.menu.down('treepanel') ;
		cfgParamTree.setValue( value, false ) ;
	},
	
	onAfterLoad: function() {
		if( !Optima5.Modules.Spec.RsiRecouveo.HelperCache.authHelperHasAll() && !this.noAuthCheck ) {
			this.doAuthCleanup() ;
		}
		this.fireEvent('ready',this) ;
	},
	doAuthCleanup: function() {}
}) ;
